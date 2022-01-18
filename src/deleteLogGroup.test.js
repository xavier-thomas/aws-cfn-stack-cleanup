import { MOCK_ERROR_CWL_NOT_EXIST, MOCK_ERROR_CWL_UNKNOWN, MOCK_LOG_GROUP } from './mocks';
import { CloudWatchLogs } from 'aws-sdk';
import { deleteLogGroup } from './deleteLogGroup';

jest.mock('aws-sdk');

describe('[deleteLogGroups.js] unit tests', () => {
	const mock_deleteLogGroup = jest.fn();

	// What to do before test is executed
	beforeEach(() => {
		jest.restoreAllMocks();
		CloudWatchLogs.mockImplementation(() => ({
			deleteLogGroup: mock_deleteLogGroup,
		}));
		jest.spyOn(console, 'error').mockImplementation(() => {});
		jest.spyOn(console, 'info').mockImplementation(() => {});
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	// What to do after each test is executed
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('[deleteLogGroup] when a Log Group name is passed', () => {
		it('must delete the log group when it exists', async () => {
			mock_deleteLogGroup.mockReturnValue({
				promise: jest.fn().mockResolvedValue({}),
			});
			const response = await deleteLogGroup(MOCK_LOG_GROUP);
			expect(mock_deleteLogGroup).toHaveBeenCalledWith({
				logGroupName: MOCK_LOG_GROUP,
			});
			expect(console.info).toHaveBeenCalledWith(`CloudWatch LogGroup: [${MOCK_LOG_GROUP}] deleted`);
			expect(response).toEqual({});
		});

		it('must ignore a log group not found error it may have already been deleted', async () => {
			mock_deleteLogGroup.mockReturnValue({
				promise: jest.fn().mockRejectedValue(MOCK_ERROR_CWL_NOT_EXIST),
			});
			const response = await deleteLogGroup(MOCK_LOG_GROUP);
			expect(console.info).toHaveBeenCalledWith(
				`Log Group: [${MOCK_LOG_GROUP}] not found. May have already been deleted`
			);
			expect(response).toEqual();
		});

		it('must throw all other errors', async () => {
			mock_deleteLogGroup.mockReturnValue({
				promise: jest.fn().mockRejectedValue(MOCK_ERROR_CWL_UNKNOWN),
			});
			await expect(deleteLogGroup(MOCK_LOG_GROUP)).rejects.toThrowError(
				`Error Deleting CloudWatch Log Group: [fake_log_group] - Unknown Error`
			);
			expect(console.info).not.toHaveBeenCalled();
		});
	});
});

import {
	MOCK_CONTEXT,
	MOCK_EVENT_CREATE,
	MOCK_EVENT_DELETE_BUCKETS,
	MOCK_EVENT_DELETE_BUCKETS_EMPTY,
	MOCK_EVENT_DELETE_BUCKETS_EMPTY_NO_PROP,
} from './mocks';
import cfnResponse from 'cfn-response-promise';
import { deleteBucket } from './deleteBucket';
import { handler } from './index';

jest.mock('./deleteBucket.js');

describe('[index.js] unit tests', () => {
	const mockCfnResponse = jest.fn();
	cfnResponse.send = mockCfnResponse;

	// What to do before test is executed
	// We probably want to set some constructors here
	beforeEach(() => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		jest.spyOn(console, 'info').mockImplementation(() => {});
		jest.spyOn(console, 'warn').mockImplementation(() => {});
	});

	// What to do after each test is executed
	// We probably want to run some destructors here

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	describe('[handler] when a valid event and context are passed', () => {
		// Test logs
		it('must log the event and context', async () => {
			await handler(MOCK_EVENT_DELETE_BUCKETS, MOCK_CONTEXT);
			expect(console.info).toHaveBeenCalledWith('Event: ' + JSON.stringify(MOCK_EVENT_DELETE_BUCKETS));
			expect(console.info).toHaveBeenCalledWith('Context: ' + JSON.stringify(MOCK_CONTEXT));
		});
	});

	describe('[handler] CloudFormation CREATE event is passed', () => {
		it('must always automatically return success', async () => {
			const result = await handler(MOCK_EVENT_CREATE, MOCK_CONTEXT);
			expect(result).toBeUndefined();
			expect(mockCfnResponse).toHaveBeenCalledWith(MOCK_EVENT_CREATE, MOCK_CONTEXT, 'SUCCESS');
			expect(console.warn).toHaveBeenCalledWith(`RequestType: [Create] ignored. Automatically returning Success.`);

			expect(deleteBucket).not.toHaveBeenCalled();
		});
	});

	describe('[handler] CloudFormation DELETE event is passed', () => {
		it('must notify success when no bucket names are passed', async () => {
			const result = await handler(MOCK_EVENT_DELETE_BUCKETS_EMPTY, MOCK_CONTEXT);
			expect(result).toBeUndefined();

			expect(mockCfnResponse).toHaveBeenCalledWith(MOCK_EVENT_DELETE_BUCKETS_EMPTY, MOCK_CONTEXT, 'SUCCESS');
			expect(console.info).toHaveBeenCalledWith(`All operations completed successfully. 0 resources cleaned up`);

			//Don't call the Delete Operation
			expect(deleteBucket).not.toHaveBeenCalled();
		});

		it('must notify success when no bucket names are passed since the BucketNames property is missing', async () => {
			const result = await handler(MOCK_EVENT_DELETE_BUCKETS_EMPTY_NO_PROP, MOCK_CONTEXT);
			expect(result).toBeUndefined();

			expect(mockCfnResponse).toHaveBeenCalledWith(MOCK_EVENT_DELETE_BUCKETS_EMPTY_NO_PROP, MOCK_CONTEXT, 'SUCCESS');
			expect(console.info).toHaveBeenCalledWith(`All operations completed successfully. 0 resources cleaned up`);

			//Don't call the Delete Operation
			expect(deleteBucket).not.toHaveBeenCalled();
		});

		it('must call the delete operation for each bucket name thats passed and notify success', async () => {
			const result = await handler(MOCK_EVENT_DELETE_BUCKETS, MOCK_CONTEXT);
			expect(result).toBeUndefined();

			expect(mockCfnResponse).toHaveBeenCalledWith(MOCK_EVENT_DELETE_BUCKETS, MOCK_CONTEXT, 'SUCCESS');
			expect(console.info).toHaveBeenCalledWith(`All operations completed successfully. 3 resources cleaned up`);

			//Call the Delete Operation for each bucket that's in the list
			expect(deleteBucket).toHaveBeenCalledTimes(3);
		});

		it('must log and report errors during deletion', async () => {
			const fakeError = new Error('A Fake Error Occurred');
			fakeError.code = 'FakeError';
			fakeError.statusCode = 999;

			deleteBucket.mockRejectedValueOnce(fakeError);

			const result = await handler(MOCK_EVENT_DELETE_BUCKETS, MOCK_CONTEXT);
			expect(result).toBeUndefined();

			expect(mockCfnResponse).toHaveBeenCalledWith(MOCK_EVENT_DELETE_BUCKETS, MOCK_CONTEXT, 'FAILED', {
				message: 'A Fake Error Occurred',
			});
			expect(console.error).toHaveBeenCalledWith(`Error during Cleanup - ${fakeError}`);

			//Call the Delete Operation for each bucket that's in the list
			expect(deleteBucket).toHaveBeenCalledTimes(3);
		});
	});
});

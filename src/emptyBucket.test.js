import {
	MOCK_ERROR_S3_BUCKET_NOT_EXIST,
	MOCK_ERROR_S3_BUCKET_UNKNOWN,
	MOCK_S3_SOURCE_BUCKET,
	generateDummyObjectList,
} from './mocks';
import { S3 } from 'aws-sdk';
import { emptyBucket } from './emptyBucket';

jest.mock('aws-sdk');

describe('[s3.js] unit tests', () => {
	const mock_deleteBucket = jest.fn();
	const mock_deleteObjects = jest.fn();
	const mock_listObjectsV2 = jest.fn();

	// What to do before test is executed
	beforeEach(() => {
		jest.restoreAllMocks();
		S3.mockImplementation(() => ({
			deleteBucket: mock_deleteBucket,
			deleteObjects: mock_deleteObjects,
			listObjectsV2: mock_listObjectsV2,
		}));
		jest.spyOn(console, 'error').mockImplementation(() => {});
		jest.spyOn(console, 'info').mockImplementation(() => {});
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	// What to do after each test is executed
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('[emptyBucket] when a bucket name is passed', () => {
		it('must first list objects in the bucket', async () => {
			const data = generateDummyObjectList(1);
			mock_listObjectsV2.mockReturnValue({
				promise: jest.fn().mockResolvedValueOnce({
					Contents: data,
				}),
			});
			mock_deleteObjects.mockReturnValue({
				promise: jest.fn().mockResolvedValueOnce({
					Deleted: data,
				}),
			});
			const response = await emptyBucket(MOCK_S3_SOURCE_BUCKET);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_listObjectsV2).toHaveBeenCalledWith({ Bucket: MOCK_S3_SOURCE_BUCKET });
			expect(mock_deleteObjects).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).toHaveBeenCalledWith({
				Bucket: MOCK_S3_SOURCE_BUCKET,
				Delete: {
					Objects: data.map((c) => {
						return { Key: c.Key };
					}),
				},
			});
			expect(response).toBeUndefined();
		});

		it('must return success if there are no objects in the bucket', async () => {
			mock_listObjectsV2.mockReturnValue({
				promise: jest.fn().mockResolvedValueOnce({
					Contents: generateDummyObjectList(0),
				}),
			});
			const response = await emptyBucket(MOCK_S3_SOURCE_BUCKET);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(console.info).toHaveBeenCalledWith(`Bucket: [${MOCK_S3_SOURCE_BUCKET}] is empty.`);
			expect(mock_deleteObjects).not.toHaveBeenCalled();
			expect(response).toBeUndefined();
		});

		it('must ignore a bucket not found error as the bucket may have already been deleted', async () => {
			mock_listObjectsV2.mockReturnValue({
				promise: jest.fn().mockRejectedValue(MOCK_ERROR_S3_BUCKET_NOT_EXIST),
			});
			const response = await emptyBucket(MOCK_S3_SOURCE_BUCKET);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).not.toHaveBeenCalled();
			expect(response).toBeUndefined();
		});

		it('must throw all other errors generated while listing objects', async () => {
			mock_listObjectsV2.mockReturnValue({
				promise: jest.fn().mockRejectedValue(MOCK_ERROR_S3_BUCKET_UNKNOWN),
			});

			await expect(emptyBucket(MOCK_S3_SOURCE_BUCKET)).rejects.toThrowError(
				`Error Listing Objects in Bucket: [fake_bucket] - Unknown Error`
			);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).not.toHaveBeenCalled();
		});

		it('must log the number of files deleted', async () => {
			const count = 500;

			mock_listObjectsV2.mockReturnValue({
				promise: jest.fn().mockResolvedValueOnce({
					Contents: generateDummyObjectList(count),
				}),
			});
			mock_deleteObjects.mockReturnValue({
				promise: jest.fn().mockResolvedValueOnce({
					Deleted: generateDummyObjectList(count),
				}),
			});
			const response = await emptyBucket(MOCK_S3_SOURCE_BUCKET);
			expect(console.info).toHaveBeenCalledWith(`Deleted [${count}] objects from Bucket: [${MOCK_S3_SOURCE_BUCKET}].`);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).toHaveBeenCalledTimes(1);
			expect(response).toBeUndefined();
		});

		it('must throw all errors generated while deleting objects', async () => {
			mock_listObjectsV2.mockReturnValue({
				promise: jest.fn().mockResolvedValueOnce({
					Contents: generateDummyObjectList(10),
				}),
			});
			mock_deleteObjects.mockReturnValue({
				promise: jest.fn().mockRejectedValue(MOCK_ERROR_S3_BUCKET_UNKNOWN),
			});
			await expect(emptyBucket(MOCK_S3_SOURCE_BUCKET)).rejects.toThrowError(
				`Error Deleting Objects in Bucket: [fake_bucket] - Unknown Error`
			);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).toHaveBeenCalledTimes(1);
		});

		it('must recursively call itself when there are more than 1000 objects in the bucket', async () => {
			mock_listObjectsV2.mockReturnValue({
				promise: jest
					.fn()
					.mockResolvedValueOnce({
						Contents: generateDummyObjectList(1000),
					})
					.mockResolvedValueOnce({
						Contents: generateDummyObjectList(100),
					}),
			});
			mock_deleteObjects.mockReturnValue({
				promise: jest
					.fn()
					.mockResolvedValueOnce({
						Deleted: generateDummyObjectList(1000),
					})
					.mockResolvedValueOnce({
						Deleted: generateDummyObjectList(100),
					}),
			});
			const result = await emptyBucket(MOCK_S3_SOURCE_BUCKET);

			expect(mock_listObjectsV2).toHaveBeenCalledTimes(2);
			expect(mock_deleteObjects).toHaveBeenCalledTimes(2);
			expect(console.info).toHaveBeenCalledWith(`Deleted [1100] objects from Bucket: [${MOCK_S3_SOURCE_BUCKET}].`);

			expect(result).toBeUndefined();
		});

		it('must log the total count of deleted objects when there are no more items in the bucket', async () => {
			mock_listObjectsV2.mockReturnValue({
				promise: jest.fn().mockResolvedValueOnce({
					Contents: generateDummyObjectList(0),
				}),
			});
			const count = 5432;

			const result = await emptyBucket(MOCK_S3_SOURCE_BUCKET, count);

			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).not.toHaveBeenCalled();
			expect(console.info).toHaveBeenCalledWith(`Deleted [${count}] objects from Bucket: [${MOCK_S3_SOURCE_BUCKET}].`);

			expect(result).toBeUndefined();
		});
	});
});

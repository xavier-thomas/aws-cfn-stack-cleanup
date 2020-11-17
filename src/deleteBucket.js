import { S3Client } from '@aws-sdk/client-s3';
import { emptyBucket } from './emptyBucket';

/**
 * Delete an S3 Bucket
 * Attempt to empty it first before deleting.
 * @param {String} srcBucket - The S3 Bucket Name to Delete
 *
 */

export const deleteBucket = async (srcBucket) => {
	const s3 = new S3Client();

	try {
		// Attempt to empty the bucket first before deleting it.
		await emptyBucket(srcBucket);

		const response = await s3.deleteBucket({ Bucket: srcBucket });
		console.info(`Bucket: [${srcBucket}] deleted.`);
		return response;
	} catch (err) {
		if (err.code === 'NoSuchBucket') {
			//Bucket likely already Deleted
			console.info(`Bucket: [${srcBucket}] not found. May have already been deleted.`);
			return;
		} else {
			throw new Error(`Error Deleting Bucket: [${srcBucket}] - ${err.message}`);
		}
	}
};

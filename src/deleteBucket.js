import { S3 } from 'aws-sdk';
import { emptyBucket } from './emptyBucket';

/**
 * Delete an S3 Bucket
 * Attempt to empty it first before deleting.
 * @param {String} srcBucket - The S3 Bucket Name to Delete
 *
 */

export const deleteBucket = async (srcBucket) => {
	const s3 = new S3();

	try {
		// Attempt to empty the bucket first before deleting it.
		await emptyBucket(srcBucket);

		const response = await s3.deleteBucket({ Bucket: srcBucket }).promise();
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

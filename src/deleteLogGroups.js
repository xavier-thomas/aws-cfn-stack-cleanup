import { CloudWatchLogs } from 'aws-sdk';
import { emptyBucket } from './emptyBucket';


/**
 * Delete an S3 Bucket
 * Attempt to empty it first before deleting.
 * @param {String} srcBucket - The S3 Bucket Name to Delete
 *
 */

export const deleteLogGroup = async (srcBucket) => {
	const CWL = new CloudWatchLogs();

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









		try {
			await CWL.deleteLogGroup({ logGroupName: lgName }).promise();
			console.info(`CloudWatch LogGroup [${lgName}] deleted`);
		} catch (err) {
			if (err.code === 'ResourceNotFoundException') {
				// This is fine
			} else {
				// TODO: delete this?
				console.error(err.message);
				throw new Error(`Failed to delete CloudWatch LogGroup [${lgName}] ${err}`);
			}
		}
	});

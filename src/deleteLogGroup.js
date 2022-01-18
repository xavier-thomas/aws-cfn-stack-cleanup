import { CloudWatchLogs } from 'aws-sdk';

/**
 * Delete a Cloudwatch Log group
 * @param {String} lgName - The Log Group Name to Delete
 *
 */

export const deleteLogGroup = async (lgName) => {
	const cwl = new CloudWatchLogs();

	try {
		const response = await cwl.deleteLogGroup({ logGroupName: lgName }).promise();
		console.info(`CloudWatch LogGroup: [${lgName}] deleted`);
		return response;
	} catch (err) {
		if (err.code === 'ResourceNotFoundException') {
			//Log group likely already Deleted
			console.info(`Log Group: [${lgName}] not found. May have already been deleted`);
			return;
		} else {
			throw new Error(`Error Deleting CloudWatch Log Group: [${lgName}] - ${err.message}`);
		}
	}
};

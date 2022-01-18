import { FAILED, SUCCESS, send } from 'cfn-response-promise';
import { deleteBucket } from './deleteBucket.js';
import { deleteLogGroup } from './deleteLogGroup';

/**
 * Invokes the CFN Cleanup Lambda
 *
 * @param {Object} event :Cloudformation Custom Resource Event
 * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-requests.html
 * @param {Object} event.ResourceProperties - Resource Properties are user defined parameters passed from the CFN custom Resource event
 * @param {string[]} event.ResourceProperties.BucketNames - An Array of S3 Bucket Names to delete
 * @param {string[]} event.ResourceProperties.LogGroupNames - An Array of Cloudwatch Log Group Names to delete
 * @param {string[]} event.ResourceProperties.StackNames - An Array of Cloudformation Stack Names to delete
 *
 * @param {Object} context :Lambda Invoke Context
 * https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 *
 * @returns {Promise} response
 * Status - The status value sent by the custom resource provider in response to an AWS CloudFormation-generated request.
 * Must be either SUCCESS or FAILED.
 * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-responses.html
 */

exports.handler = async (event, context) => {
	console.log('Event: ' + JSON.stringify(event));
	console.log('Context: ' + JSON.stringify(context));

	const requestType = event.RequestType;
	const bucketNames = event.ResourceProperties.BucketNames ? event.ResourceProperties.BucketNames : [];
	const logGroupNames = event.ResourceProperties.LogGroupNames ? event.ResourceProperties.LogGroupNames : [];

	//Only Process Delete Requests. Create / Update requests are automatically successful
	if (requestType !== 'Delete') {
		console.warn(`RequestType: [${event.RequestType}] ignored. Automatically returning Success.`);
		return send(event, context, SUCCESS);
	}

	try {
		const bNamesPromises = bucketNames.map(async (bName) => {
			await deleteBucket(bName);
		});

		const lgNamePromises = logGroupNames.map(async (lgName) => {
			await deleteLogGroup(lgName);
		});

		await Promise.all(Array.prototype.concat(bNamesPromises, lgNamePromises));
		const nResources = bNamesPromises.length + lgNamePromises.length;
		console.info(`All operations completed successfully. ${nResources} resources cleaned up`);
		return send(event, context, SUCCESS);
	} catch (err) {
		console.error(`Error during Cleanup - ${err}`);
		return send(event, context, FAILED, {
			message: err.message,
		});
	}
};

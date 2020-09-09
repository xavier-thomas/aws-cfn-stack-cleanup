import { S3 } from 'aws-sdk';

const s3 = new S3();

/**
 * Empty Files from S3 Bucket
 *
 * @param {String} srcBucket - The S3 Bucket Name to Empty
 * @param {Number} count - The number of objects in the bucket. Defaults to 0.
 * @returns {Promise} Recursion to continue deleting objects when the s3 list objects limit of 1000 is exceeded
 *
 */

const emptyBucket = async (srcBucket, count = 0) => {
	let data;
	try {
		data = await s3.listObjectsV2({ Bucket: srcBucket }).promise();
	} catch (err) {
		if (err.code === 'NoSuchBucket' && err.statusCode === 404) {
			//Bucket likely already Deleted
			return;
		}
		throw new Error(`Error Listing Objects in Bucket: [${srcBucket}] - ${err}`);
	}

	if (data.Contents.length === 0) {
		if (count > 0) {
			console.info(`Deleted [${count}] objects from Bucket: [${srcBucket}]`);
		} else {
			console.info(`Bucket: [${srcBucket}] is empty`);
		}
		return;
	}

	try {
		const deleteData = await s3
			.deleteObjects({
				Bucket: srcBucket,
				Delete: {
					Objects: data.Contents.map((c) => {
						return { Key: c.Key };
					}),
				},
			})
			.promise();

		count += deleteData.Deleted.length;

		// S3 list method cannot return more than 1K items,
		// Therefore recursively call the emptyBucket function to recursively delete more than 1k items.
		if (deleteData.Deleted.length >= 1000) {
			return emptyBucket(srcBucket, count);
		}

		console.info(`Deleted [${count}] objects from Bucket: [${srcBucket}]`);
	} catch (err) {
		throw new Error(`Error Deleting Objects in Bucket: [${srcBucket}] - ${err}`);
	}
};

module.exports.emptyBucket = emptyBucket;

/**
 * Delete an S3 Bucket
 * Attempt to empty it first before deleting.
 * @param {String} srcBucket - The S3 Bucket Name to Delete
 *
 */

exports.deleteBucket = async (srcBucket) => {
	// Attempt to empty the bucket first before deleting it.
	await emptyBucket(srcBucket);

	try {
		await s3.deleteBucket({ Bucket: srcBucket }).promise();
		console.info(`Bucket: [${srcBucket}] deleted`);
	} catch (err) {
		if (err.code === 'NoSuchBucket' && err.statusCode === 404) {
			//Bucket likely already Deleted
			return;
		}
		throw new Error(`Error Deleting Bucket: [${srcBucket}] - ${err}`);
	}
};

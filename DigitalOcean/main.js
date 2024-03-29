const got    = require("got");
const chalk  = require('chalk');
const os     = require('os');

var config = {};
// Retrieve our api token from the environment variables.
config.token = process.env.DOTOKEN;

if( !config.token )
{
	console.log(chalk`{red.bold DOTOKEN is not defined!}`);
	console.log(`Please set your environment variables with appropriate token.`);
	console.log(chalk`{italic You may need to refresh your shell in order for your changes to take place.}`);
	process.exit(1);
}

// console.log(chalk.green(`Your token is: ${config.token}`));

// Configure our headers to use our token when making REST api requests.
const headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.token
};

var keyId;
var dropletId;
class DigitalOceanProvider
{
	// Documentation for needle:
	// https://github.com/tomas/needle

	async listRegions()
	{
		let response = await got('https://api.digitalocean.com/v2/regions', { headers: headers, json:true })
							 .catch(err => console.error(`listRegions ${err}`));
							 
		if( !response ) return;

		if( response.body.regions )
		{
			for( let region of response.body.regions)
			{
				// Print out
				console.log(`Region ${region.name}, ${region.slug} `);
			}
		}

		if( response.headers )
		{
			console.log( chalk.yellow(`Calls remaining ${response.headers["ratelimit-remaining"]}`) );
		}
	}

	async listImages( )
	{
		// HINT: Add this to the end to get better filter results: ?type=distribution&per_page=100
		let response = await got('https://api.digitalocean.com/v2/images?type=distribution&per_page=100', { headers: headers, json:true })
							 .catch(err => console.error(`images ${err}`));
							 
		if( !response ) return;

		if( response.body.images )
		{
			for( let image of response.body.images)
			{
				// Print out
				console.log(` ${image.name}, ${image.slug} `);
			}
		}

		if( response.headers )
		{
			console.log( chalk.yellow(`Calls remaining ${response.headers["ratelimit-remaining"]}`) );
		}

	}

	async createDroplet (dropletName, region, imageName , keyId)
	{
		// console.log(`${DOTOKEN}`);
		if( dropletName == "" || region == "" || imageName == "" || keyId == "" )
		{
			console.log( chalk.red("You must provide non-empty parameters for createDroplet!") );
			return;
		}
		var ssh=[keyId];
		var data = 
		{
			"name": dropletName,
			"region":region,
			"size":"512mb",
			"image":imageName,
			"ssh_keys":ssh,
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

		console.log("Attempting to create: "+ JSON.stringify(data) );

		let response = await got.post("https://api.digitalocean.com/v2/droplets", 
		{
			headers:headers,
			json:true,
			body: data
		}).catch( err => 
			console.error(chalk.red(`createDropletErr: ${err}`)) 
		);

		if( !response ) return;

		// console.log(response.statusCode);
		// console.log(response.body);

		if(response.statusCode == 202)
		{
			console.log(chalk.green(`Created droplet id ${response.body.droplet.id}`));
			dropletId = response.body.droplet.id;
		}
	}

	async dropletInfo ()
	{
		var url = 'https://api.digitalocean.com/v2/droplets/' + dropletId;
		// console.log(url);
		let response = await got(`${url}`, 
		{
			headers:headers,
			json:true,
		}).catch( err => 
			console.error(chalk.red(`dropletInforErr: ${err}`)) 
		);

		if( !response ) return;
			// console.log(response);
			console.log("IP Address: ");
		if( response.body.droplet )
		{
			let droplet = response.body.droplet;
			console.log(droplet.networks.v4[0].ip_address);
			// Print out IP address
		}
	}

	async deleteDroplet(id)
	{
		if( typeof id != "number" )
		{
			console.log( chalk.red("You must provide an integer id for your droplet!") );
			return;
		}

		// HINT, use the DELETE verb.
		var url = 'https://api.digitalocean.com/v2/droplets/' + id;
		let response = await got.delete(`${url}`, 
		{
			headers:headers,
			json:true,
		}).catch( err => 
			console.error(chalk.red(`dropletDeleteErr: ${err}`)) 
		);

		if( !response ) return;

		// No response body will be sent back, but the response code will indicate success.
		// Specifically, the response code will be a 204, which means that the action was successful with no returned body data.
		if(response.statusCode == 204)
		{
			console.log(`Deleted droplet ${id}`);
		}

	}

	async listKeys( )
	{
		// HINT: Add this to the end to get better filter results: ?type=distribution&per_page=100
		let response = await got('https://api.digitalocean.com/v2/account/keys', { headers: headers, json:true })
							 .catch(err => console.error(`listKeys ${err}`));
							 
		if( !response ) return;

		if( response )
		{
				// console.log(response.body.ssh_keys[0].id);
				keyId=response.body.ssh_keys[0].id;
		}

		// if( response.headers )
		// {
		// 	console.log( chalk.yellow(`Calls remaining ${response.headers["ratelimit-remaining"]}`) );
		// }

	}

};
async function provision()
{
	let client = new DigitalOceanProvider();

	// #############################################
	// #1 Print out a list of available regions
	// Comment out when completed.
	// https://developers.digitalocean.com/documentation/v2/#list-all-regions
	// use 'slug' property
	// await client.listRegions();

	// #############################################
	// #2 Extend the client object to have a listImages method
	// Comment out when completed.
	// https://developers.digitalocean.com/documentation/v2/#images
	// - Print out a list of available system images, that are AVAILABLE in a specified region.
	// - use 'slug' property or id if slug is null
	// await client.listImages();

	// #############################################
	// #3 Create an droplet with the specified name, region, and image
	// Comment out when completed. ONLY RUN ONCE!!!!!
	var name = "madhu"+os.hostname();
	var region = "nyc1"; // Fill one in from #1
	var image = "ubuntu-14-04-x32"; // Fill one in from #2
	// keyId= 23923810;
	await client.listKeys();
	await client.createDroplet(name, region, image, keyId);
	

	// Record the droplet id that you see print out in a variable.
	// We will use this to interact with our droplet for the next steps.

	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// BEFORE MOVING TO STEP FOR, REMEMBER TO COMMENT OUT THE `createDroplet()` call!!!

	// #############################################
	// #4 Extend the client to retrieve information about a specified droplet.
	// Comment out when done.
	// https://developers.digitalocean.com/documentation/v2/#retrieve-an-existing-droplet-by-id
	// REMEMBER POST != GET
	// Most importantly, print out IP address!
	setTimeout(client.dropletInfo, 20000);
	// await client.dropletInfo(dropletId);
	// #############################################
	// #5 In the command line, ping your server, make sure it is alive!
	// ping xx.xx.xx.xx

	// #############################################
	// #6 Extend the client to DESTROY the specified droplet.
	// https://developers.digitalocean.com/documentation/v2/#delete-a-droplet
	// await client.deleteDroplet(dropletId);

	// #############################################
	// #7 In the command line, ping your server, make sure it is dead!
	// ping xx.xx.xx.xx
}


// Run workshop code...
(async () => {
	await provision();
})();

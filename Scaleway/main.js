const got    = require("got");
const chalk  = require('chalk');
const os     = require('os');

var config = {};
config.token = process.env.SWTOKEN;
config.oid = process.env.SWOID;
if( !config.token )
{
	console.log(chalk`{red.bold SWTOKEN is not defined!}`);
	console.log(`Please set your environment variables with appropriate token.`);
	console.log(chalk`{italic You may need to refresh your shell in order for your changes to take place.}`);
	process.exit(1);
}
const headers =
{
	'Content-Type':'application/json',
	'X-Auth-Token' : config.token
};
var server_id;

class ScalewayProvider
{
	async createServer (name, image_id, commercial_type,enable_ipv6)
	{
		var data = 
		{
			"name": name,
			"image": image_id,
			"commercial_type": commercial_type,
			"organization": config.oid,
			"enable_ipv6": enable_ipv6,
			"boot_type": "local"
		};
		let response = await got.post("https://cp-par1.scaleway.com/servers", 
		{
			headers:headers,
			json:true,
			body: data
		}).catch( err => 
			console.error(chalk.red(`createDroplet: ${err}`)) 
		);
		if( !response ) return;
		server_id = response.body.server.id;
			console.log(chalk.green(`Created server with id ${response.body.server.id}`));
	}

	async serverInfo ()
	{
		var url = 'https://cp-par1.scaleway.com/servers/' + server_id;
		let response = await got(`${url}`, 
		{
			headers:headers,
			json:true,
		}).catch( err => 
			console.error(chalk.red(`serverInfo: ${err}`)) 
		);
		if( !response ) return;
		console.log(response.body.server.public_ip.address);

	}

	async poweron()
	{
		console.log("Powering on the VM...");
		var data = 
		{
			"action":"poweron"
		};
		var url = 'https://cp-par1.scaleway.com/servers/' + server_id + '/action';
		let response = await got.post(`${url}`, 
		{
			headers:headers,
			json:true,
			body: data
		}).catch( err => 
			console.error(chalk.red(`serverInfo: ${err}`)) 
		);
		if( !response ) return;

	}

};


async function provision()
{
	let client = new ScalewayProvider();
	var name = "HW1"+os.hostname();
	var image_id = "2fa25ccf-f30e-4225-b328-87472a35c75d"; // imgae_id for Alpine Linux according to their documentation
	var commercial_type = "START1-S";
	await client.createServer(name, image_id, commercial_type,false);
	setTimeout(client.poweron, 120000);
	setTimeout(client.serverInfo, 240000);
}
(async () => {
	await provision();
})();

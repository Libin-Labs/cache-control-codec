import api = require('@lp-labs/cache-control-codec');
const flag: true | string | undefined = api.parseCacheControl('no-cache').get('no-cache');
void flag;

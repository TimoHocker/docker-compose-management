const fs = require ('fs').promises;
const path = require('path');

(async () => {
  const services = (await fs.readdir('services'))
    .filter(s=>/^[a-z]/ui.test(s));
  const service_networks = {};
  const netplan = JSON.parse(await fs.readFile('config/networks.json','utf-8'));
  const nw_list = netplan.map(v=>v.name);

  console.log(`graph networks {`);
  console.log('  layout=circo');
  console.log('  overlap=false');
  console.log('  splines=true');
  console.log('');
  console.log(services.map(v=>`  s_${v} [shape=square,label=${v}]`).join('\n'));
  console.log('');
  console.log(netplan.map(v=>`  n_${v.name} [label=${v.name}${v.internal?',color=blue,style=bold':''}]`).join('\n'));

  for (let s of services) {
    console.log('');
    const yml = await fs.readFile(path.join('services',s,'docker-compose.yml'),'utf-8');
    const networks_section = /^(\s+)networks:((?:\s+^\1\s{2}(?:.+|\S+(?:$|:)))+)/mu.exec(yml);
    if (!networks_section) continue;
    const networks = [];
    const externals = [];
    const nw_regex = /^(?:[\s-]+)([^:\s]+):?$/mug;
    while (true) {
      const res = nw_regex.exec(networks_section[2]);
      if (!res) break;
      if (nw_list.includes(res[1]))
        networks.push(netplan.filter(v=>v.name===res[1])[0])
      else
        externals.push(res[1])
    }
    service_networks[s]=networks;
    console.log(networks.map(v=>`  s_${s} -- n_${v.name}${v.internal?' [color=blue]':''}`).join('\n'));
    console.log(externals.map(v=>`  e_${s}_${v} [label=${v},color=red]\n  s_${s} -- e_${s}_${v}`).join('\n'));
  }
  console.log('}');
})()

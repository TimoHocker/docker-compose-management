echo "===== initializing =====";
echo "-- volumes --";
for vol in $(cat config/volumes.json | jq -r '.[].name'); do
  echo "+ creating volume $vol";
  docker volume create $vol > /dev/null;
done;

echo "-- networks --";
for network in $(cat config/networks.json | jq -c '.[]'); do
  net=$(echo "$network" | jq -r '.name');
  is_internal=$(echo "$network" | jq -r '.internal');
  subnet=$(echo "$network" | jq -r '.subnet');
  echo "+ creating network $net";
  if [[ "$is_internal" == "true" ]]; then
    net="--internal $net";
  fi;
  if [[ "$subnet" != "null" ]]; then
    net="--subnet $subnet $net";
  fi;
  docker network create $net > /dev/null;
done;

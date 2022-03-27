#!/bin/bash

source ./_init_functions.sh;

if [[ "$TARGET_STATE" == "UP" ]]; then
  bash struct_init.sh;
  echo "===== starting services =====";
elif [[ "$TARGET_STATE" == "DOWN" ]]; then
  echo "===== stopping services =====";
else
  echo "=====   running tasks   =====";
fi;

SERVICE_GROUPS=$(cat config/groups.json | jq -r '.start_order[]' | sed 's/\s+/ /g');
PASSIVE_GROUPS=$(cat config/passive.json | jq -r '.groups[]' | sed 's/\s+/ /g');

if [[ "$TARGET_STATE" == "DOWN" ]]; then
  SERVICE_GROUPS=$(echo "$SERVICE_GROUPS" | tac);
fi;

for g in $SERVICE_GROUPS; do
  if [[ $INCLUDE_PASSIVE == 0 ]] && isIn $g "$PASSIVE_GROUPS"; then continue; fi; 
  echo "-- ${g} --";
  ./group_init.sh $g $@;
done;

if [[ "$TARGET_STATE" == "DOWN" ]]; then
  docker network prune -f;
fi;

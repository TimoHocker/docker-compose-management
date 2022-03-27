#!/bin/bash

GROUP_NAME="$1";
shift;

source ./_init_functions.sh;

PASSIVE_SERVICES=$(cat config/passive.json | jq -r '.services[]' | sed 's/\s+/ /g');
SERVICES=$(cat config/groups.json | jq -r ".groups.${GROUP_NAME}[]" | sed 's/\s+/ /g');

if [[ "$TARGET_STATE" == "DOWN" ]]; then
  SERVICES=$(echo "$SERVICES" | tac);
fi;

for s in $SERVICES; do
  if [[ $INCLUDE_PASSIVE == 0 ]] && isIn $s "$PASSIVE_SERVICES"; then continue; fi;
  pushd "services/$s";
  if [[ $DO_PULL == 1 ]]; then
    docker-compose pull;
  fi;
  if [[ "$TARGET_STATE" != "NONE" ]]; then
    if [[ "$TARGET_STATE" == "UP" ]]; then
      docker-compose up -d;
    else
      docker-compose down --remove-orphans;
    fi;
  fi;
  popd;
done;

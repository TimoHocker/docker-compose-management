#!/bin/bash

echo "" > filter

add() {
    echo "${@}" >> filter
}

volumes=$(cat config/volumes.json | jq -r '.[] | select(.backup != false) | .name' | sed 's/\s+/ /g' | sort)

for v in $volumes; do
  add "+ /${v}/";
done;

add "- /*";

for v in $volumes; do
  excludes=$(cat config/volumes.json |
    jq -r ".[] | select(.name == \"${v}\" and has(\"backup_exclude\")) | .backup_exclude[]");
  filter_lines=$(echo "$excludes" | while read e; do
    if [ -z "$e" ]; then continue; fi;
    path=$(readlink -m "/${v}/_data/${e}");
    if [[ "$e" =~ /$ ]]; then
      path="$path/";
    fi;
    echo "- ${path}";
  done);

  if [ -z "$filter_lines" ]; then continue; fi;
  add "$filter_lines";
done;

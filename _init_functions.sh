pushd() {
  command pushd "$@" > /dev/null;
}
popd() {
  command popd "$@" > /dev/null;
}

isIn() {
  for v in $2; do
    if [[ "$v" == "$1" ]]; then
      return 0;
    fi;
  done;
  return 1;
}

TARGET_STATE="UP";
INCLUDE_PASSIVE=0;
DO_PULL=0;

for arg in $@; do
  if [[ "$arg" == "DOWN" ]]; then TARGET_STATE="DOWN"; fi;
  if [[ "$arg" == "NONE" ]]; then TARGET_STATE="NONE"; fi;
  if [[ "$arg" == "ALL" ]] || [[ "$arg" == "ACTIVE" ]]; then INCLUDE_PASSIVE=1; fi;
  if [[ "$arg" == "PULL" ]]; then DO_PULL=1; fi;
done;

if [[ "$TARGET_STATE" == "DOWN" ]]; then
  # invert default state of INCLUDE_PASSIVE if shutting down
  INCLUDE_PASSIVE=$((1-$INCLUDE_PASSIVE));
  DO_PULL=0;
fi;

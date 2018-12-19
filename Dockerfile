FROM node:10-alpine

LABEL "com.github.actions.name"="Chive Action"
LABEL "com.github.actions.description"="Generate NOTICE files from package-lock.json"
LABEL "com.github.actions.icon"="mic"
LABEL "com.github.actions.color"="purple"

LABEL "repository"="http://github.com/dabutvin/chive-action"
LABEL "homepage"="http://github.com/dabutvin/chive-action"
LABEL "maintainer"="dabutvin <butvinik@outlook.com>"

ADD entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

FROM node:10-alpine

LABEL "com.github.actions.name"="NOTICE file generator"
LABEL "com.github.actions.description"="Generate a NOTICE file from your package-lock.json"
LABEL "com.github.actions.icon"="droplet"
LABEL "com.github.actions.color"="green"

LABEL "repository"="http://github.com/dabutvin/chive-action"
LABEL "homepage"="http://github.com/dabutvin/chive-action"
LABEL "maintainer"="dabutvin <butvinik@outlook.com>"

ADD entrypoint.sh /entrypoint.sh
ADD index.js /index.js
ADD package-lock.json /package-lock.json
ADD package.json /package.json
RUN cd / && npm install
ENTRYPOINT ["/entrypoint.sh"]

FROM node:10-alpine

LABEL "com.github.actions.name"="Hello World"
LABEL "com.github.actions.description"="Write arguments to the standard output"
LABEL "com.github.actions.icon"="mic"
LABEL "com.github.actions.color"="purple"

LABEL "repository"="http://github.com/dabutvin/hello-action"
LABEL "homepage"="http://github.com/dabutvin/hello-action"
LABEL "maintainer"="dabutvin <butvinik@outlook.com>"

ADD entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

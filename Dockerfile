FROM node:4-onbuild
MAINTAINER Kevin Glinski

# Copy the current directory to the container
COPY ./node_modules /app/node_modules
COPY ./package.json /app
COPY ./*.js /app/

# Set our working directory from here on out
WORKDIR /app

RUN ls

RUN pwd

# Install app dependencies
RUN npm install

EXPOSE  8888
EXPOSE  5060

# Start node
CMD ["npm", "start"]

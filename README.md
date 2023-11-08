# code-interpeter
> excute python (or any) code on docker containers

The main point from this app is to have a server than runs code on docker containers.
Any client can communicatie and request to run code with the server with a socket connection, streaming input and output to the container to fully interact with the code

## To run the app follow the following instructions
- clone the repository and open its directory
- run `npm i`
- run `npm run dev`
- open `localhost:3000` for a demo

## prerequisites
- NodeJS
- Docker
- Python image for docker `docker pull python`

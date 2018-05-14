In this chapter readers will learn what is a virtual machine containers, why they are useful. Readers will learn most popular container framework Docker and learn how to configure an image for it. Next readers will learn how to deploy their application to online services that provide container-based infrastructure.

What is container for NextJS app
In previous chapter we have covered the tests as a must have prerequisite for automated deployment. Now let's take a closer look on the other part — deployment and reproducibility of production environment.

Modern virtualization technologies allowed to create cheap and performant virtual machines, this is essentially an emulated computer running on real computer, with operating system, I/O and everything else. From the view point of a program, that runs inside a VM, it is almost indistinguishable from the real computer, at least if program does not touch low level interfaces, which is highly unlikely if you do regular web development.

Since everything on virtual machine is controlled by host: memory, CPU, storage, everything, we can make snapshots of virtual machine. Later we can use those snapshots to transition VM from one state to another. We even can write a script that will step by step bring a seed state to some final state, say, empty Linux OS to state with NodeJS and other software installed. These states can be tagged and stored.

There are several technologies that allow to do that, for example Vagrant and Docker. The main difference is that Vagrant is a virtual machine manager whereas Docker is a container manager. A container image is a lightweight, stand-alone, executable package of a piece of software that includes everything needed to run it: code, runtime, system tools, system libraries, settings. The main difference is that container is an operating system level virtualization and Vagrant is machine-level virtualization. Containers are much cheaper than VMs because they can run on one OS instance and don't have overheads of multiple completely isolated VMs each with own OS.

For our purposes containers will work better primarily because they provide enough functionality to run isolated reproducible environments with minimum overhead.

Creating Docker container for for NextJS
Let's reiterate. Docker is a virtual machine with OS that is capable of managing of containers. So how to bring the container image to a required tools, libs and settings? Via an instruction file, of course, because this process has to be reproducible on dev machine, on staging, on production and anywhere else.

Dockerfile is a set of instructions which take a source image and bring it to a desired state, which results in an image too. Which also can be taken as source and so on.

Let's start with super minimal set of packages:

$ npm i react react-dom isomorphic-unfetch --save
$ npm i next --save-dev
Next we create scripts in package.json as usual:

{
  "scripts": {
    "start": "next",
    "build": "next build",
    "server": "next server"
  }
}
Let's create our very first Dockerfile. We start with official NodeJS image, each step will create an intermediate image:

FROM node:latest
This line tells that we would like to take latest NodeJS image as foundation

WORKDIR /app
This is basically as CD inside a directory inside the container. It will be created if it does not exist.

ADD package.json .npmrc ./
We add package.json and .npmrc to container, it's like a copy but to a different OS.

ENV NPM_CONFIG_LOGLEVEL warn
Set environment variable, in this case, silence NPM's verboseness.

RUN npm install
Here we simply execute a command, because container system has only package.json and .npmrc until those two files change we can cache the result of npm install. This is the power of Docker, we can later change anything in our sources but the cached image with installed modules will not be rebuilt until we touch package.

ADD pages ./pages
Now we copy the rest of the codebase (add more directories if needed).

RUN NODE_ENV=production npm run build
Then since we have the sources we can run the main build.

CMD NODE_ENV=production npm run server
And finally we specify the command that will be used as main long running script.

Here is the resulting Dockerfile:

# Dockerfile
FROM node:latest
WORKDIR /app
ADD package.json .npmrc ./
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
ADD pages ./pages
RUN NODE_ENV=production npm run build
CMD NODE_ENV=production npm run server
Now we can build the image:

$ docker build --tag nextjs .
This will produce something like this as console output:

$ docker build --tag nextjs .

Sending build context to Docker daemon 84.38MB
Step 1/8 : FROM node:latest
 ---> c1d02ac1d9b4
Step 2/8 : WORKDIR /app
 ---> Using cache
 ---> 7ad698557939
Step 3/8 : ADD package.json .npmrc ./
 ---> 62c7aedf5cb2
Step 4/8 : ENV NPM_CONFIG_LOGLEVEL warn
 ---> Running in e8164d671ffb
Removing intermediate container e8164d671ffb
 ---> 7aa21abc3f66
Step 5/8 : RUN npm install
 ---> Running in 4eef79cb0ac8
added 776 packages in 15.263s
Removing intermediate container 4eef79cb0ac8
 ---> a412d0bc3e0e
Step 6/8 : ADD pages ./pages
 ---> e51e7e209b37
Step 7/8 : RUN NODE_ENV=production npm run build
 ---> Running in 4848bec94bbd
> 7-2-docker-ssr@1.0.0 build /app
> next build
Removing intermediate container 4848bec94bbd
 ---> cbd50a380abb
Step 8/8 : CMD NODE_ENV=production npm run server
 ---> Running in bacd03b2fe05
Removing intermediate container bacd03b2fe05
 ---> 77a221cb892d
Successfully built 77a221cb892d
Now let's run the container:

$ docker run -p 8080:3000 nextjs
Here we have mapped local port 8080 to container port 3000 (default port of NextJS) and ran the container nextjs. The output will be like so:

$ docker run -p 8080:3000 nextjs 

> 7-2-docker-ssr@1.0.0 server /app
> next start
> Ready on http://localhost:3000
The message Ready on http://localhost:3000 means CONTAINER port, in order to access the server from your browser you must use LOCAL port, which is 8080.

Basically, this already can be used in production.

But there is another method of using NextJS — a static build, and it requires another kind of setup.

Let us refresh what static build is. It is a version of website which can be served statically from any web server like Apache or Nginx, which suggests, that we will need both NodeJS to build and Apache/Nginx to run. Of course we can make one Dockerfile with both services but it will be very generous in terms of space — NodeJS is needed only to build, so if resulting image will still contain it it's a wasted space, NodeJS will not be present in runtime. Some time ago we'd create two Dockerfiles, build and run them sequentially, one would be a builder, second one would be a server, but this is not very convenient. Luckily in latest versions of Docker a technology called multi-stage build was introduced. It allows to take files from one image and add them to another image.

Let's add a static build to package.json scripts first:

// package.json
{
  "scripts": {
    "static": "next export"
  }
}
Then we have to add a next.config.js with a pathmap:

// next.config.js
module.exports = {
    exportPathMap: () => ({
        '/': {page: '/'}
    })
};
Now let's create a Dockerfile, first part will be quite the same as before:

# Dockerfile
FROM node:latest as build
WORKDIR /app
ADD package.json .npmrc ./
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
ADD pages next.config.js ./
RUN NODE_ENV=production npm run build
RUN NODE_ENV=production npm run static
Notice as build and that this file no longer has CMD section, it's because there is nothing to be executed "daemonized", nothing will run in runtime.

Now let's write the second part of the Dockerfile which runs Nginx with a static build from the first part:

# Dockerfile
FROM nginx:latest AS production
RUN mkdir -p /usr/share/nginx/html
WORKDIR /usr/share/nginx/html
COPY --from=build /app/out .
Notice that we have copied files from build image's ( --from=build) directory /app/out to current work directory.

Now let's try it out.

$ docker build --tag nextjs .
$ docker run -p 8080:80 nextjs
Open your browser and open the page http://localhost:8080, you should see "Hello, octocat!" and the console output should look like this (some lines were omitted for compactness):

$ docker build --tag nextjs .

Sending build context to Docker daemon 60.95MB
Step 1/13 : FROM node:latest as build
latest: Pulling from library/node
Digest: sha256:bd7b9aaf77ab2ce1e83e7e79fc0969229214f9126ced222c64eab49dc0bdae90
Status: Downloaded newer image for node:latest
 ---> aa3e171e4e95
Step 2/13 : WORKDIR /app
Removing intermediate container 16976f79c64b
 ---> f32ea6e77a9a
Step 3/13 : ADD package.json .npmrc ./
 ---> 072e1f684d0b
Step 4/13 : ENV NPM_CONFIG_LOGLEVEL warn
 ---> Running in c57d28703d1a
Removing intermediate container c57d28703d1a
 ---> f93784ce430f
Step 5/13 : RUN npm install
 ---> Running in 42d4a0a46e6a
added 660 packages in 14.655s
Removing intermediate container 42d4a0a46e6a
 ---> 9e0fe68685e5
Step 6/13 : ADD pages ./pages
 ---> 2503f70e9696
Step 7/13 : ADD next.config.js ./
 ---> e4b68980279e
Step 8/13 : RUN NODE_ENV=production npm run build
 ---> Running in d4be23864c46
> 7-2-docker-static@1.0.0 build /app
> next build
Removing intermediate container d4be23864c46
 ---> b69fbf6dec0e
Step 9/13 : RUN NODE_ENV=production npm run static
 ---> Running in 7b946925c7c2
> 7-2-docker-static@1.0.0 static /app
> next export
  using build directory: /app/.next
  exporting path: /
Removing intermediate container 7b946925c7c2
 ---> 9e2b0fe9251a
Step 10/13 : FROM nginx:latest AS production
latest: Pulling from library/nginx
Digest: sha256:18156dcd747677b03968621b2729d46021ce83a5bc15118e5bcced925fb4ebb9
Status: Downloaded newer image for nginx:latest
 ---> b175e7467d66
Step 11/13 : RUN mkdir -p /usr/share/nginx/html
 ---> Running in 568c1743f3de
Removing intermediate container 568c1743f3de
 ---> 36d271661cca
Step 12/13 : WORKDIR /usr/share/nginx/html
Removing intermediate container 2a199ef4bc5d
 ---> 00fe8c21e4be
Step 13/13 : COPY --from=build /app/out .
 ---> c9d050120ef9
Successfully built c9d050120ef9
Successfully tagged nextjs:latest

$ docker run -p 8080:80 nextjs

172.17.0.1 - - [17/Apr/2018:03:39:26 +0000] "GET / HTTP/1.1" 200 2560 "-" ... blablabla
172.17.0.1 - - [17/Apr/2018:03:39:26 +0000] "GET /_next/ ... blablabla
172.17.0.1 - - [17/Apr/2018:03:39:26 +0000] "GET /_next/ ... blablabla
172.17.0.1 - - [17/Apr/2018:03:39:26 +0000] "GET /_next/ ... blablabla
The resulting image is pure Nginx with only a build and nothing else. We can make it even leaner by taking a different source image for the second phase, but that's out of the scope for now.

Now you can take the resulting image and upload it to your production Docker machine, but then you'll need a private repository or you should use Amazon WS or anything similar where you can upload images. Or, you can run same commands (build & run) on your production machine given it has access to your Git repository. Both approaches work, but the approach when you build on production is kinda awkward, build on builder machines or locally and run production images on production machines. After all the production only takes care about images, it should not know how the image was created. 

In order to do a complete CI your server should be capable of building Docker images on successful test runs and deploy them automatically. This could be achieved with Gitlab, Github and Travis, of course, but we are not covering this right now since there are simpler solutions.

Deploying to Heroku
Taking care of the health of your NodeJS server in server-side rendering mode can be tricky, you have to monitor the different parameters, you have to take care about logs and do all other operational things. Nowadays lots of providers offer free and paid servers where you can deploy apps without necessity to dive into server side specifics, you write apps, they do the rest.

A popular service Heroku.com offers various servers for different languages, including JS and NodeJS in particular, they have optimized containers that can run your apps.

After you have signed up into Heroku create a new project, name it and once created click "Connect to Github". Type in the name of the repository and click "Connect".



If you want everything to be fully automatic, click "Wait for CI to pass before deploy" (we assume you have already added Travis integration) and click "Enable Automatic Deploys".



Now let's configure our app to be Heroku-compatible. First, let's modify the scripts of package.json:

// package.json
{
  "scripts": {
    "heroku-postbuild": "next build",
    "start": "next",
    "server": "next start",
    "test": "NODE_ENV=test jest"
  }
}
Here we have following scripts: start for dev, server for production server and heroku-postbuild in order to call NextJS build for Heroku.

Next we need to teach Heroku to run proper command, for this we create a Procfile:

web: npm run server -- --port $PORT
Heroku defines a PORT environment variable so we must respect it.

You can install Heroku CLI and use the following command to verify that it will run proper script:

$ heroku local web
Now, just commit all new stuff and wait for CI to pass or hit the "Deploy branch" button if you're not patient. Once everything is done you can open your app at https://yourappname.herokuapp.com. After first run which can take some time you will see your app.

Deploying to Now.sh
Heroku is a well known workhorse, but nowadays there are newer player that can do things even easier. For example, Now.sh.

In addition to previous example just add one more script with now-specific name now-start to package.json:

// package.json
{
  "scripts": {
    "heroku-postbuild": "npm run build",
    "build": "next build",
    "start": "next",
    "server": "next start",
    "now-start": "npm run server",
    "test": "NODE_ENV=test jest"
  }
}
Then install Now Desktop from their website, register/login and run

$ now
This will produce something like this:

$ now

> Your credentials and configuration were migrated to "~/.now"
> Deploying ~/Sites/next-test under xxx
> Your deployment's code and logs will be publicly accessible because you are subscribed to the OSS plan.
> NOTE: You can use `now --public` or upgrade your plan (https://zeit.co/account/plan) to skip this prompt
> Using Node.js 8.11.1 (default)
> https://xxx.now.sh [in clipboard] (sfo1) [4s]
> Synced 9 files (351.6KB) [4s]
> Building…
> ▲ npm install
> ✓ Using "package-lock.json"
> ⧗ Installing 7 main dependencies…
> ▲ npm run build
> 6-3-e2e-tests@1.0.0 build /home/nowuser/src
> next build
> ▲ Snapshotting deployment
> ▲ Saving deployment image (107.8M)
> Build completed
> Verifying instantiation in sfo1
> [0] 6-3-e2e-tests@1.0.0 now-start /home/nowuser/src
> [0] npm run server
> [0] 6-3-e2e-tests@1.0.0 server /home/nowuser/src
> [0] next start
> [1] 6-3-e2e-tests@1.0.0 now-start /home/nowuser/src
> [1] npm run server
> [1] 6-3-e2e-tests@1.0.0 server /home/nowuser/src
> [1] next start
> [2] 6-3-e2e-tests@1.0.0 now-start /home/nowuser/src
> [2] npm run server
> ✔ Scaled 1 instance in sfo1 [26s]
> Success! Deployment ready
Just copy-paste the address https://whatever-been-assigned.now.sh and observe your website in the wild.

Now let's automate the deployment using Travis, bc right now we only can deploy from local dev computer.

In order to deploy we will need a Now.sh token, you can copy-paste it from ~/.now/auth.json, it look like this:

// ~/.now/auth.json
{
  "_": "This is your Now credentials file. DON'T SHARE! More: https://git.io/v5ECz",
  "credentials": [
    {
      "provider": "sh",
      "token": "xxxxxxxxxxxxxxxxxxxxxx"
    }
  ]
}
Go to http://travis-ci.org and open your repository settings there, paste the token in "Environment Variables" section and make sure "Display value in logs" is OFF.

We will need a package from NPM:

$ npm install now --save-dev
Alter the .travis.yml to make use of installed package:

# .travis.yml
language: node_js
node_js:
- stable
after_success:
- npm run now-deploy
Add the script to package.json:

// package.json
{
 "scripts": {
    "now-deploy": "now -e NODE_ENV=production --token $NOW_TOKEN --npm --public",
    "build": "next build",
    "start": "next",
    "server": "next start",
    "now-start": "npm run server",
    "test": "NODE_ENV=test jest"
  }
}
Commit, push, wait, see the logs of TravisCI, the address of deployment is there the same way as in local deployment. You probably would want to also add alias for your website at Now.sh.

Psst! Docker deployments are also supported, just put Dockerfile in your Git repository.
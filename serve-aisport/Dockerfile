FROM node:slim

LABEL AUTOR 'diplez' 

ENV AISPORT_DIR '/home/serve_aisports/'

RUN mkdir ${AISPORT_DIR}

#PARA CREAR NODE EN DIRECTORIO EN CONTENEDOR
WORKDIR ${AISPORT_DIR}

RUN cd ${AISPORT_DIR}

RUN npm install firebase-functions@latest firebase-admin@latest --save
RUN npm install -g firebase-tools
RUN npm install -g --save nodemon

RUN npm init -f

COPY index.js .

RUN npm install --save express

#AQUI SE PUEDE COLOCAR DIRECTO EL node index.js PORQ ESTA DENTRO DE LA CARPETA Y NO FUERA
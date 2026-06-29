# STAGE-1
# Build the Kong plugins
FROM golang:1.23.0-alpine3.20 AS plugin-builder

WORKDIR /builder

# Copy and build the pep-plugin
COPY ../kong-plugins/pep-plugin /builder/pep-plugin
WORKDIR /builder/pep-plugin
RUN go build -o pep-plugin

# STAGE-2
# Build Kong including the plugins that were built in the previous stage
FROM kong:3.7.1
USER root

# Install Python + dependencies
RUN apt-get update
RUN apt-get install -y python3 python3-pip python3-dev musl-dev libffi-dev gcc g++ file make

#Install Python Plugin dependency
RUN PYTHONWARNINGS=ignore pip3 install kong-pdk requests pyld

# Set PYTHONPATH to the correct directory
ENV PYTHONPATH="/usr/local/lib/python3.10/dist-packages:/usr/lib/python3/dist-packages"

# Copy Go plugins from the builder stage
COPY --from=plugin-builder /builder/pep-plugin/pep-plugin /usr/local/kong/go-plugins/pep-plugin

# Copy validator-plugin.py into python-plugins and kong-pluginserver.py into python-pluginserver
COPY --chown=kong --chmod=555 ../kong-plugins/kong-pluginserver/ /usr/bin/kong/python-pluginserver/  
COPY --chown=kong --chmod=555 ../kong-plugins/validator-plugin/ /usr/local/kong/python-plugins/

USER kong
#ENTRYPOINT ["/docker-entrypoint.sh"]
#EXPOSE 8000 8443 8001 8444
#STOPSIGNAL SIGQUIT
#HEALTHCHECK --interval=10s --timeout=10s --retries=10 CMD kong health
#CMD ["kong", "docker-start"]

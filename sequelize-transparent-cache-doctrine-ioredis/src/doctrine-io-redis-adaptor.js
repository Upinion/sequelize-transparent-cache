const { serialize, unserialize } = require('php-serialize');
class DoctrineIORedisAdaptor {
    constructor ({ client, roClient, namespace, prefix, lifetime, cacheKeyLifetime }) {
        this.client = client;
        if (roClient) {
            this.roClient = roClient;
        } else {
            this.roClient = client;
        }
        this.namespace = namespace;
        this.prefix = prefix;
        this.lifetime = lifetime;
        this.delimiter = ':';
        this.namespaceVersion = null;
        this.lastNamespaceModel = null;
        this.cacheKeyLifetime = cacheKeyLifetime || 604800;
    }

    _withNamespace (key) {
        const namespace = this.namespace;
        const keyWithNamespace = namespace
            ? [namespace, ...key]
            : key;
        let objectId = keyWithNamespace.pop();
        if (this.prefix) {
            objectId = `${this.prefix}_${objectId}`;
        }
        const model = keyWithNamespace.pop();
        return this._getNamespaceVersion(model)
            .then((version) => {
                const keyNameSpace = [...keyWithNamespace, model].join(this.delimiter);
                return `${keyNameSpace}[${objectId}][${version}]`;
            }); 
    }

    resetNamespaceVersion() {
        this.lastNamespaceModel = null;
        this.namespaceVersion = null;
    }

    _getNamespaceVersion (model) {
        if (this.namespaceVersion !== null && this.lastNamespaceModel === model) {
            return Promise.resolve(this.namespaceVersion);
        }


        const namespaceCacheKey = this._getNamespaceCacheKey(model);
        return this.roClient.get(namespaceCacheKey)
            .then(data => {
                let version;
                if (!data) {
                    version = 1;
                } else {
                    version = unserialize(data) || 1;
                }
                this.lastNamespaceModel = model;
                this.namespaceVersion = version;
                return version;
            });
    }

    _setNamespaceVersion (model, version) {
        const namespaceCacheKey = this._getNamespaceCacheKey(model);
        this.lastNamespaceModel = model;
        this.namespaceVersion = version;

        const options = this.cacheKeyLifetime
            ? ['EX', this.cacheKeyLifetime]
            : [];

        return this.client.set(
            namespaceCacheKey,
            serialize(version),
            options
        );
    }

    _getNamespaceCacheKey (model) {
        if (this.namespace) {
            return `${this.namespace}${this.delimiter}DoctrineNamespaceCacheKey[${model}]`;
        }
        return `DoctrineNamespaceCacheKey[${model}]`;

    }

    set (key, value) {
        const options = this.lifetime
            ? ['EX', this.lifetime]
            : [];

        return this._withNamespace(key)
            .then((nkey) => {
                return this.client.set(
                    nkey,
                    JSON.stringify(value),
                    options
                );
            });
    }

    get (key) {
        return this._withNamespace(key)
            .then((nkey) => {
                return this.roClient.get(nkey)
            })
            .then(data => {
                if (!data) {
                    return data;
                }

                return JSON.parse(data, (key, value) => {
                    return value && value.type === 'Buffer'
                        ? Buffer.from(value.data)
                        : value;
                })
            });
    }

    del (key) {
        return this._withNamespace(key)
            .then((nkey) => {
                return this.client.del(nkey);
            });
    }

    clearKey (model) {
        const namespaceCacheKey = this._getNamespaceCacheKey(model);
        return this._getNamespaceVersion(model)
            .then((namespaceVersion) => {
                return this._setNamespaceVersion(model, namespaceVersion + 1);
            });
    }
}

module.exports = DoctrineIORedisAdaptor

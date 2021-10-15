class DoctrineMemJSAdaptor {
    constructor ({ client, namespace, prefix, lifetime, cacheKeyLifetime }) {
        this.client = client;
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

    _wrapperGet(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, value) => {
                if (err) {
                    console.log('Cache error:', err, 'for key:', key);
                    resolve(null);
                } else if (value) {
                    resolve(value.toString());
                } else {
                    resolve(null);
                }
            });
        });
    }

    _wrapperSet(key, value, lifetime) {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, { expires: lifetime }, (err, value) => {
                if (err) {
                    console.log('Cache error:', err, 'for key:', key);
                    resolve(null);
                } else if (value) {
                    resolve(value);
                } else {
                    resolve(null);
                }
            });
        });
    }

    _wrapperDelete(key) {
        return new Promise((resolve, reject) => {
            this.client.delete(key, (err, value) => {
                if (err) {
                    console.log('Cache error:', err, 'for key:', key);
                    resolve(null);
                } else if (value) {
                    resolve(value);
                } else {
                    resolve(null);
                }
            });
        });
    }

    _getNamespaceVersion (model) {
        if (this.namespaceVersion !== null && this.lastNamespaceModel === model) {
            return Promise.resolve(this.namespaceVersion);
        }


        const namespaceCacheKey = this._getNamespaceCacheKey(model);
        return this._wrapperGet(namespaceCacheKey)
            .then((data) => {
                let version;
                if (!data) {
                    version = 1;
                } else {
                    version = Number(data) || 1;
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

        const options = this.cacheKeyLifetime || null;

        return this._wrapperSet(
            namespaceCacheKey,
            version,
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
        const options = this.lifetime || null;

        return this._withNamespace(key)
            .then((nkey) => {
                return this._wrapperSet(
                    nkey,
                    JSON.stringify(value),
                    options
                );
            });
    }

    get (key) {
        return this._withNamespace(key)
            .then((nkey) => {
                return this._wrapperGet(nkey)
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
                return this._wrapperDelete(nkey);
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

module.exports = DoctrineMemJSAdaptor

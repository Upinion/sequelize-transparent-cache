const { serialize, unserialize } = require('php-serialize');
class DoctrineIORedisAdaptor {
    constructor ({ client, namespace, prefix, lifetime, cacheKeyLifetime }) {
        this.client = client;
        this.namespace = namespace;
        this.prefix = prefix;
        this.lifetime = lifetime;
        this.delimiter = ':';
        this.namespaceVersion = null;
        this.cacheKeyLifetime = cacheKeyLifetime || 604800;
    }

    _withNamespace (key) {
        const namespace = this.namespace;
        const keyWithNamespace = namespace;
            ? [namespace, ...key]
            : key;
        let objectId = keyWithNamespace.pop();
        if (this.prefix) {
            objectId = `${this.prefix}_${objectId}`;
        }
        const model = keyWithNamespace.pop();
        const version = this._getNamespaceVersion(model); 
        const keyNameSpace = [...keyWithNamespace, model].join(this.delimiter);
        return `${keyNameSpace}[${objectId}][${version}]`;
    }

    _getNamespaceVersion (model) {
        if (this.namespaceVersion !== null) {
            return this.namespaceVersion;
        }

        const namespaceCacheKey = this._getNamespaceCacheKey(model);
        return this.client.get(namespaceCacheKey)
            .then(data => {
                if (!data) {
                    return 1;
                }
                const version = unserialize(data) || 1;
                this.namespaceVersion = version;
                return version;
            });
    }

    _setNamespaceVersion (model, version) {
        const namespaceCacheKey = this._getNamespaceCacheKey(model);
        this.namespaceVersion = version;
        return this.client.set(
            namespaceCacheKey,
            serialize(version),
            ['EX', this.cacheKeyLifetime]
        );
    }

    _getNamespaceCacheKey (model) {
        return `DoctrineNamespaceCacheKey[${model}]`;
    }

    set (key, value) {
        const options = this.lifetime
            ? ['EX', this.lifetime]
            : [];

        return this.client.set(
            this._withNamespace(key),
            JSON.stringify(value),
            options
        );
    }

    get (key) {
        return this.client.get(this._withNamespace(key))
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
        return this.client.del(this._withNamespace(key));
    }

    clearKey (model) {
        const namespaceCacheKey = this._getNespaceCacheKey(model);
        const namespaceVersion  = this._getNamespaceVersion(model) + 1;

        return this._setNamespaceVersion(model, namespaceVersion);
    }
}

module.exports = DoctrineIORedisAdaptor

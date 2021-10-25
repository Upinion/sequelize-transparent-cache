const { instanceToData, dataToInstance } = require('./util');

function getInstanceModel (instance) {
    return instance.constructor;
}

function getInstanceCacheKey (instance) {
    return getInstanceModel(instance).primaryKeyAttributes.map(pk => instance[pk]);
}

function findAssociation (parentModel, targetName) {
    if (parentModel && parentModel.associations) {
        const [as, association] = Object.entries(parentModel.associations || []).find(([x1, x2]) => x2.target.name === targetName);
        if (as && association) {
            return {
                as,
                association
            };
        }
    }
    return null;
}

function recursiveGetInclude (model, include) {
    if (Array.isArray(include)) {
        return include.map(x => recursiveGetInclude(model, x));
    } else if (include && include.model) {
        const includeAssociation = findAssociation(model, include.model.name) 
        if (includeAssociation) {
            const ret = {
                model: includeAssociation.association.target.name,
                as: include.as ? include.as : includeAssociation.as
            };
            if (include.include) {
                ret.include = recursiveGetInclude(includeAssociation.association.target, include.include);
            }
            return ret;
        } 
    }
    return [];
}

function getQueryInclude (model, [{ include }]) {
    if (include) {
        return recursiveGetInclude(model, include);
    }
    return [];
}

async function save (client, instance, include, customKey) {
    if (!instance) {
        return Promise.resolve(instance);
    }

    const key = [
        getInstanceModel(instance).tableName
    ];

    if (customKey) {
        key.push(customKey);
    } else {
        key.push(...getInstanceCacheKey(instance));
    }

    return client.set(key, instanceToData(instance, include)).then(() => instance);
}

function saveAll (client, model, instances, include, customKey) {
    const key = [
        model.tableName,
        customKey
    ];

    return client.set(key, instances.map(x => instanceToData(x, include))).then(() => instances);
}

function getAll (client, model, customKey) {
    const key = [
        model.tableName,
        customKey
    ];

    return client.get(key).then(dataArray => {
        if (!dataArray) { // undefined - cache miss
            return dataArray;
        }
        return dataArray.map(data => dataToInstance(model, data));
    });
}

function get (client, model, id) {
    const key = [
        model.tableName,
        id
    ];

    return client.get(key).then(data => {
        return dataToInstance(model, data);
    });
}

function destroy (client, instance) {
    if (!instance) {
        return Promise.resolve(instance);
    }

    const key = [
        getInstanceModel(instance).tableName,
        ...getInstanceCacheKey(instance)
    ];
    return client.del(key);
}

function clearKey (client, instance, model) {
    const key = [
        model ? model.tableName : getInstanceModel(instance).tableName
    ];
    if (client.clearKey) {
        return client.clearKey(key);
    }
    return Promise.resolve(false);
}

module.exports = {
    getQueryInclude,
    save,
    saveAll,
    get,
    getAll,
    destroy,
    clearKey
}

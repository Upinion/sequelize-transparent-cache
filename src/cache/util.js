function instanceToData (instance, include) {
    return {
        data: instance.get({ plain: true }),
        include
    };
}

function fillInclude (model, include) {
    if (!include || !Array.isArray(include)) return [];
    if (Array.isArray(include)) {
        return include.map((x) => {
            const ret = x;
            ret.model = model.sequelize.model(ret.model);
            if (ret.include) {
                ret.include = fillInclude(model, ret.include);
            }
            return ret;
        });
    } else {
        const ret = include;
        ret.model = model.sequelize.model(ret.model);
        if (ret.include) {
            ret.include = fillInclude(model, ret.include);
        }
        return ret; 
    }
}

function dataToInstance (model, data) {
    if (!data) {
        return data;
    }
    let instance;
    if (data.data && data.include) {
        // Retrieve data and include from the cache
        instance = model.build(data.data, { isNewRecord: false, raw: false, include: fillInclude(model, data.include) });
    } else {
        // Fallback to old behaviour
        const include = generateIncludeRecurse(model);
        instance = model.build(data, { isNewRecord: false, raw: false, include });
    }
    return instance;
}

// TODO fix date types in a different way
function restoreTimestamps (data, instance) {
    const timestampFields = ['createdAt', 'updatedAt', 'deletedAt']

    for (const field of timestampFields) {
        const value = data[field]
        if (value) {
            instance.setDataValue(field, new Date(value))
        }
    }

    Object.keys(data).forEach(key => {
        const value = data[key]

        if (!value) {
            return
        }

        if (Array.isArray(value)) {
            try {
                const nestedInstances = instance.get(key)
                value.forEach((nestedValue, i) => restoreTimestamps(nestedValue, nestedInstances[i]))
            } catch (error) { // TODO: Fix issue with JSON and BLOB columns

            }

            return
        }

        if (typeof value === 'object') {
            try {
                const nestedInstance = instance.get(key)
                Object.values(value).forEach(nestedValue => restoreTimestamps(nestedValue, nestedInstance))
            } catch (error) { // TODO: Fix issue with JSON and BLOB columns

            }
        }
    })
}

function generateIncludeRecurse (model, depth = 1) {
    if (depth > 5) {
        return []
    }
    return Object.entries(model.associations || [])
        .filter(([as, association]) => {
            const hasOptions = Object.prototype.hasOwnProperty.call(association, 'options')
            return hasOptions
        })
        .map(([as, association]) => {
            const associatedModel = model.sequelize.model(association.target.name)
            return {
                model: associatedModel,
                include: generateIncludeRecurse(associatedModel, depth + 1),
                as
            }
        })
}

module.exports = {
    instanceToData,
    dataToInstance
}

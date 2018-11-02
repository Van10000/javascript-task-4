'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы several и through
 */
const isStar = true;

function getOrCreateActionsByName(mainNamespace, actionName) {
    const action = mainNamespace.find(({ name }) => name === actionName);

    if (action) {
        return action;
    }

    mainNamespace.push({ name: actionName, actions: [] });

    return mainNamespace[mainNamespace.length - 1];
}

function getOrCreateUpActionsObjects(mainNamespace, name) {
    const splitName = name.split('.');

    return splitName.reduce((acc, val, ind) => {
        let curName = splitName.slice(0, ind + 1).join('.');
        acc.push(getOrCreateActionsByName(mainNamespace, curName));

        return acc;
    }, []);
}

function getOrCreateDownActionsObjects(mainNamespace, name) {
    return mainNamespace.filter(curObject => {
        return curObject.name.startsWith(name + '.') || curObject.name === name;
    });
}

function getOrCreateActions(mainNamespace, name) {
    return getOrCreateUpActionsObjects(mainNamespace, name)
        .sort((first, second) => second.name.length - first.name.length)
        .reduce((acc, val) => {
            acc.push(...val.actions);

            return acc;
        }, []);
}

function setFunction(emitObject, namespace, context, handler) {
    const funcObject = { context: context, handler: handler };
    getOrCreateActionsByName(emitObject, namespace).actions.push(funcObject);
}

function unsetFunction(emitObject, namespace, context) {
    for (let emit of getOrCreateDownActionsObjects(emitObject, namespace)) {
        emit.actions = emit.actions.filter(action => action.context !== context);
    }
}

/**
 * Возвращает новый emitter
 * @returns {Object}
 */
function getEmitter() {
    const mainNamespace = [];

    return {

        /**
         * Подписаться на событие
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @returns {Object} emitter
         */
        on: function (event, context, handler) {
            setFunction(mainNamespace, event, context, handler);

            return this;
        },

        /**
         * Отписаться от события
         * @param {String} event
         * @param {Object} context
         * @returns {Object} emitter
         */
        off: function (event, context) {
            unsetFunction(mainNamespace, event, context);

            return this;
        },

        /**
         * Уведомить о событии
         * @param {String} event
         * @returns {Object} emitter
         */
        emit: function (event) {
            getOrCreateActions(mainNamespace, event)
                .forEach(func => func.handler.call(func.context));

            return this;
        },

        /**
         * Подписаться на событие с ограничением по количеству полученных уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} times – сколько раз получить уведомление
         * @returns {Object} emitter
         */
        several: function (event, context, handler, times) {
            let count = 0;
            let newHandler = () => {
                if (count < times) {
                    handler.call(context);
                }
                count++;
            };
            if (times <= 0) {
                newHandler = handler;
            }
            this.on(event, context, newHandler);

            return this;
        },

        /**
         * Подписаться на событие с ограничением по частоте получения уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} frequency – как часто уведомлять
         * @returns {Object} emitter
         */
        through: function (event, context, handler, frequency) {
            let count = 0;
            let newHandler = () => {
                if (count === 0) {
                    handler.call(context);
                }
                count = (count + 1) % frequency;
            };
            if (frequency <= 0) {
                newHandler = handler;
            }
            this.on(event, context, newHandler);

            return this;
        }
    };
}

module.exports = {
    getEmitter,

    isStar
};

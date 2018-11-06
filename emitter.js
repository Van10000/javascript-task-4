'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы several и through
 */
const isStar = true;
function getNamespace() {
    let mainNamespace = [];

    return {
        getOrCreateActionsByName: function (actionName) {
            let action = mainNamespace.find(({ name }) => name === actionName);
            if (action) {
                return action;
            }
            action = { name: actionName, actions: [] };
            mainNamespace.push(action);

            return action;
        },

        getOrCreateUpActionsObjects: function (name) {
            const nameParts = name.split('.');

            return nameParts.reduce((acc, val, ind) => {
                let curName = nameParts.slice(0, ind + 1).join('.');
                acc.push(this.getOrCreateActionsByName(curName));

                return acc;
            }, []);
        },

        getOrCreateDownActionsObjects: function (name) {
            return mainNamespace.filter(curObject =>
                curObject.name.startsWith(name + '.') || curObject.name === name);
        },

        getOrCreateActions: function (name) {
            return this.getOrCreateUpActionsObjects(name)
                .sort((first, second) => second.name.length - first.name.length)
                .reduce((acc, val) => acc.concat(val.actions), []);
        },

        setFunction: function (namespace, context, handler) {
            const funcObject = { context, handler };
            this.getOrCreateActionsByName(namespace).actions.push(funcObject);
        },

        unsetFunction: function (namespace, context) {
            for (let emit of this.getOrCreateDownActionsObjects(namespace)) {
                emit.actions = emit.actions.filter(action => action.context !== context);
            }
        }
    };
}


/**
 * Возвращает новый emitter
 * @returns {Object}
 */
function getEmitter() {
    const namespace = getNamespace();

    return {

        /**
         * Подписаться на событие
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @returns {Object} emitter
         */
        on: function (event, context, handler) {
            namespace.setFunction(event, context, handler);

            return this;
        },

        /**
         * Отписаться от события
         * @param {String} event
         * @param {Object} context
         * @returns {Object} emitter
         */
        off: function (event, context) {
            namespace.unsetFunction(event, context);

            return this;
        },

        /**
         * Уведомить о событии
         * @param {String} event
         * @returns {Object} emitter
         */
        emit: function (event) {
            namespace.getOrCreateActions(event)
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
            let handlerWrapper = (times > 0) ? () => {
                if (count < times) {
                    handler.call(context);
                }
                count++;
            } : handler;
            this.on(event, context, handlerWrapper);

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
            let handlerWrapper = (frequency > 0) ? () => {
                if (count === 0) {
                    handler.call(context);
                }
                count = (count + 1) % frequency;
            } : handler;
            this.on(event, context, handlerWrapper);

            return this;
        }
    };
}

module.exports = {
    getEmitter,

    isStar
};

const Lock = require('../Lock');
const PoliticalAccount = require('./PoliticalAccount');
const PoliticalCoalition = require('./PoliticalCoalition');
const PoliticalDatabase = require('./PoliticalDatabase');

class Manager {
    static #accountsPool = new Map();
    static #coalitionsPool = new Map();


    static isAccountAllowed = (handle) => Manager.#accountsPool.has(handle);
    
    static isCoalitionAllowed = (name) => Manager.#coalitionsPool.has(name);

    static getAccountByHandle = (handle) => Manager.isAccountAllowed(handle) ? Manager.#accountsPool.get(handle) : null;

    static getCoalitionByName = (name) => Manager.isCoalitionAllowed(name) ? Manager.#coalitionsPool.get(name) : null;

    static getAccounts = () => Array.from(Manager.#accountsPool.values(), (account) => ({ handle: account.username, coalition: account.coalition }));

    static getCoalitions = () => Array.from(Manager.#coalitionsPool.values(), (coalition) => ({ name: coalition.name, logo_color: coalition.color }));


    static getAccountsFromDatabase = async () => await PoliticalDatabase.getAccounts();

    static getCoalitionsFromDatabase = async () => await PoliticalDatabase.getCoalitions();


    static async loadDataOnStartUp() {
        Lock.lock();
        await Manager.fetchData();
        Lock.unlock();
    }


    static async fetchData() {
        let accountsPool = new Map();
        let coalitionsPool = new Map();

        const storedCoalitions = await PoliticalDatabase.getCoalitions();

        for (const coalitionData of storedCoalitions) {
            let relatedAccountsPool = [];
            const relatedAccounts = await PoliticalDatabase.getCoalitionsRelatedAccounts(coalitionData.name);

            for (const relatedAccount of relatedAccounts) {
                let account = new PoliticalAccount(relatedAccount.handle, relatedAccount.political_coalition);
                await account.fetchData();
                
                relatedAccountsPool.push(account);
                accountsPool.set(account.username, account);
            }

            const coalition = new PoliticalCoalition(coalitionData.name, coalitionData.logo_color, relatedAccountsPool);
            coalitionsPool.set(coalitionData.name, coalition);
        }

        Manager.#accountsPool = accountsPool;
        Manager.#coalitionsPool = coalitionsPool;
    }   
}

module.exports = Manager;

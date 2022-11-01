const MySql = require('../Database/MySql');

require('dotenv').config();

class PoliticalDatabase {
    static #db = new MySql(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME);

    static async getAccounts() {
        return await PoliticalDatabase.#db.getRows('accounts', '*', 'TRUE', 'political_coalition, handle');
    }

    static async getCoalitions() {
        return await PoliticalDatabase.#db.getRows('coalitions', '*', 'TRUE', 'name');
    }

    static async getCoalitionsRelatedAccounts(name) {
        return await PoliticalDatabase.#db.getRows(
            'coalitions c JOIN accounts a ON c.name = a.political_coalition',
            'handle, political_coalition',
            `name = '${name}'`,
            'political_coalition, handle'
        );
    }
}

module.exports = PoliticalDatabase;
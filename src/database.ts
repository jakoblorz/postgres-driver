import * as pgpromise from "pg-promise";

let postgres: pgpromise.IDatabase<any> | undefined;

interface IClauseValueTuple {
    clause: string;
    values: any[];
}

interface ITupleUsingPointers extends IClauseValueTuple {
    pointers: string;
}

/**
 * Database is a class to hold all the necessary methods
 */
export class Database<T extends {}, R extends string> {

    /**
     * create a new database instance
     * @param url connection string to the database
     * @param options init options for the pg-promise engine
     */
    constructor(private url: string, private options?: pgpromise.IOptions<any>) { }

    /**
     * readResource
     * @param relation specify on which relation the operation should happen
     * @param where specify the constraints a tuple needs to fullfill to be selected
     * @param select specify the columns that should be returned - should be ALL and the
     * SAME as the keys defined in the X type
     */
    public async readResource<X extends T, Y extends T>(
        relation: R, where: Y, select: Array<keyof X> | keyof X | "*" = "*") {
            
            // reduce the where clause into accessible structure
            const { clause, values } = await this.where<Y>(where);

            // build string of selected columns
            const columns = typeof select === "string" ? select : select.toString();

            // get the database interface
            const connection = await this.connect();

            // execute the query
            return await connection.oneOrNone(

                // SELECT a, b FROM relation WHERE a = $1;
                "SELECT " + columns + " FROM " + relation + " WHERE " + clause + " LIMIT 1"
            , values) as X || null;
        }

    /**
     * readResourceList
     * @param relation specify on which relation the operation should happen
     * @param where specify the constraints a tuple needs to fullfill to be selected
     * @param select specify the columns that should be retured - should be ALL and the
     * SAME as the keys defined in the X type
     * @param skip specify the tuples that should be skipped before selecting - NOTE: make
     * use of the orderByAsc/orderByDsc arguments to give sense to the expression 'skip the
     * first x tuples'
     * @param limit specify a maximum count of tuples returned
     * @param orderByAsc specify columns which should be ordered in ascending order
     * @param orderByDsc specify columns which should be ordered in descending order
     */
    public async readResourceList<X extends T, Y extends T>(
        relation: R, where: Y, select: Array<keyof X> | keyof X | "*" = "*",
        skip: number = 0, limit: number = 10,
        orderByAsc: Array<keyof X> | keyof X | string = "",
        orderByDsc: Array<keyof X> | keyof X | string = "") {
            
            // reduce the where clause into accessible structure
            const { clause, values } = await this.where<Y>(where);

            // build string of selected columns
            const columns = typeof select === "string" ? select : select.toString();

            //  build ORDER BY data for ascending orders
            const ascending = typeof orderByAsc === "string" ? orderByAsc + " ASC " : (orderByAsc as string[])
                .reduce<string>((acc, val) => acc += val + " ASC, ", "").slice(0, -2);

            // build ORDER BY data for descending orders
            const descending = typeof orderByDsc === "string" ? orderByDsc + " DESC " : (orderByDsc as string[])
                .reduce<string>((acc, val) => acc += val + " DESC, ", "").slice(0, -2);

            // check if ORDER BY statement is wanted
            const useOrderBy = orderByAsc !== "" || orderByDsc !== "" || (orderByAsc !== "" && orderByDsc !== "");

            // get the database interface
            const connection = await this.connect();

            // build the query
            const query = 
                // SELECT a,b,c FROM relation WHERE a = $1
                "SELECT " + columns + " FROM " + relation + " WHERE " + clause +

                // ORDER BY a ASC, b DSC
                (useOrderBy ? " ORDER BY " : "") +
                // insert ASC statements, check if a comma is required at the end because there
                // will be DSC clauses
                (orderByAsc !== "" ? (orderByDsc !== "" ? ascending + ", " : ascending) : "") +
                (orderByDsc !== "" ? descending : "") +

                // OFFSET 10 LIMIT 10;
                (skip > 0 ? " OFFSET " + skip + " " : "") + (limit > 0 ? " LIMIT " + limit + " " : "");

            // tslint:disable-next-line:no-console
            console.log(query);

            // execute the query
            return await connection.many(query, values) as X[] || [];
        }

    /**
     * createResource
     * @param relation specify on which relation the operation should happen
     * @param tuple specify the data to insert
     */
    public async createResource<X extends T>(
        relation: R, tuple: X) {

            // reduce the tuple clause into accessible structure
            // tslint:disable-next-line:prefer-const
            let { clause, pointers, values } = Object.keys(tuple)
                .reduce<ITupleUsingPointers>((acc, key, index) => {
                        acc.values.push((tuple as any)[key]);
                        acc.clause += key + ", ";
                        acc.pointers += "$" + (index + 1) + ", ";
                        return acc;
                },  { clause: "", pointers: "", values: []});

            // remove the last commas
            clause = clause.slice(0, -2);
            pointers = pointers.slice(0, -2);

            // get the database interface
            const connection = await this.connect();

            // execute the query
            return await connection.none(

                // INSERT INTO relation (a, b) VALUES ($1, $2);
                "INSERT INTO " + relation + " (" + clause + ") VALUES (" + pointers + ")"
            , values) as null || null;
        }

    /**
     * updateResource
     * @param relation specify on which relation the operation should happen
     * @param update specify the data to manipulate
     * @param where specify the constraints a tuple needs to fullfill to be updated
     */
    public async updateResource<X extends T, Y extends T>(
        relation: R, update: X, where: Y) {
            
            // reduce the update clause into accessible structure
            const set = await this.set<X>(update);

            // decoy ($x) literals need index shifting
            const updateIndexOffset = set.values.length;

            // reduce the where clause into accessible structure
            const { clause, values } = await this.where<Y>(where, updateIndexOffset);

            // concat the values array into the update values array
            Array.prototype.push.apply(set.values, values);

            // get the database interface
            const connection = await this.connect();

            // execute the query
            return await connection.none(

                // UPDATE relation SET a = $1 WHERE b = $2;
                "UPDATE " + relation + " SET " + set.clause + " WHERE " + clause
            , set.values) as null || null;
        }

    /**
     * deleteResource
     * @param relation specify on which relation the operation should happen
     * @param where specify the constraint a tuple needs to fullfill to be deleted
     */
    public async deleteResource<X extends T>(
        relation: R, where: X) {
            
            // reduce the where clause into accessible structure
            const { clause, values } = await this.where<X>(where);

            // get the database interface
            const connection = await this.connect();

            // execute the query
            return await connection.none(

                // DELETE FROM relation WHERE a = $1;
                "DELETE FROM " + relation + " WHERE " + clause
            , values) as null || null;
        }

    /**
     * obtain a database interface to execute queries
     */
    public async connect() {

        // postgres object could not have been initialized yet
        if (postgres === undefined) {
            postgres = pgpromise(this.options)(this.url);
        }

        // return the postgres object
        return postgres;
    }

    /**
     * reduce a select object into a where clause
     * @param selection value object where the keys are the columns compare with the values
     * @param offset initialize the decoy ($x) literal with an offset
     */
    private async where<Y>(selection: Y, offset: number = 0) {
        
        // reduce object to clause-values data structure
        const where = Object.keys(selection).reduce<IClauseValueTuple>((acc, key, i) => {
            acc.values.push((selection as any)[key]);
            acc.clause += key + " = $" + (i + 1 + offset) + " AND ";
            return acc;
        }, { clause: "", values: [] });

        // remove the last AND off the clause
        where.clause = where.clause.slice(0, -5);

        return where;
    }

    /**
     * reduce an update object into a set clause
     * @param update value object where the keys are the columns to update and the values
     * are the values to insert
     * @param offset initialize the decoy ($x) literal with an offset
     */
    private async set<Y>(update: Y, offset: number = 0) {

        // reduce object to clause-values data structure
        const set = Object.keys(update).reduce<IClauseValueTuple>((acc, key, i) => {
            acc.values.push((update as any)[key]);
            acc.clause += key + " = $" + (i + 1 + offset) + ", ";
            return acc;
        }, { clause: "", values: [] });

        // remove the last space and comma of the clause string
        set.clause = set.clause.slice(0, -2);

        return set;
    }
}

const db = new Database<{ id?: string }, "accounts" | "users">("");

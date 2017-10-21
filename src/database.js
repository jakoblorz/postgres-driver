"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pgpromise = require("pg-promise");
var postgres;
/**
 * Database is a class to hold all the necessary methods
 */
var Database = /** @class */ (function () {
    /**
     * create a new database instance
     * @param url connection string to the database
     * @param options init options for the pg-promise engine
     */
    function Database(url, options) {
        this.url = url;
        this.options = options;
    }
    /**
     * readResource
     * @param relation specify on which relation the operation should happen
     * @param where specify the constraints a tuple needs to fullfill to be selected
     * @param select specify the columns that should be returned - should be ALL and the
     * SAME as the keys defined in the X type
     */
    Database.prototype.readResource = function (relation, where, select) {
        if (select === void 0) { select = "*"; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, clause, values, columns, connection;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.where(where)];
                    case 1:
                        _a = _b.sent(), clause = _a.clause, values = _a.values;
                        columns = typeof select === "string" ? select : select.toString();
                        return [4 /*yield*/, this.connect()];
                    case 2:
                        connection = _b.sent();
                        return [4 /*yield*/, connection.oneOrNone(
                            // SELECT a, b FROM relation WHERE a = $1;
                            "SELECT " + columns + " FROM " + relation + " WHERE " + clause + " LIMIT 1", values)];
                    case 3: 
                    // execute the query
                    return [2 /*return*/, (_b.sent()) || null];
                }
            });
        });
    };
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
    Database.prototype.readResourceList = function (relation, where, select, skip, limit, orderByAsc, orderByDsc) {
        if (select === void 0) { select = "*"; }
        if (skip === void 0) { skip = 0; }
        if (limit === void 0) { limit = 10; }
        if (orderByAsc === void 0) { orderByAsc = ""; }
        if (orderByDsc === void 0) { orderByDsc = ""; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, clause, values, columns, ascending, descending, useOrderBy, connection, query;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.where(where)];
                    case 1:
                        _a = _b.sent(), clause = _a.clause, values = _a.values;
                        columns = typeof select === "string" ? select : select.toString();
                        ascending = typeof orderByAsc === "string" ? orderByAsc + " ASC " : orderByAsc
                            .reduce(function (acc, val) { return acc += val + " ASC, "; }, "").slice(0, -2);
                        descending = typeof orderByDsc === "string" ? orderByDsc + " DESC " : orderByDsc
                            .reduce(function (acc, val) { return acc += val + " DESC, "; }, "").slice(0, -2);
                        useOrderBy = orderByAsc !== "" || orderByDsc !== "" || (orderByAsc !== "" && orderByDsc !== "");
                        return [4 /*yield*/, this.connect()];
                    case 2:
                        connection = _b.sent();
                        query = 
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
                        return [4 /*yield*/, connection.many(query, values)];
                    case 3: 
                    // execute the query
                    return [2 /*return*/, (_b.sent()) || []];
                }
            });
        });
    };
    /**
     * createResource
     * @param relation specify on which relation the operation should happen
     * @param tuple specify the data to insert
     */
    Database.prototype.createResource = function (relation, tuple) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, clause, pointers, values, connection;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = Object.keys(tuple)
                            .reduce(function (acc, key, index) {
                            acc.values.push(tuple[key]);
                            acc.clause += key + ", ";
                            acc.pointers += "$" + (index + 1) + ", ";
                            return acc;
                        }, { clause: "", pointers: "", values: [] }), clause = _a.clause, pointers = _a.pointers, values = _a.values;
                        // remove the last commas
                        clause = clause.slice(0, -2);
                        pointers = pointers.slice(0, -2);
                        return [4 /*yield*/, this.connect()];
                    case 1:
                        connection = _b.sent();
                        return [4 /*yield*/, connection.none(
                            // INSERT INTO relation (a, b) VALUES ($1, $2);
                            "INSERT INTO " + relation + " (" + clause + ") VALUES (" + pointers + ")", values)];
                    case 2: 
                    // execute the query
                    return [2 /*return*/, (_b.sent()) || null];
                }
            });
        });
    };
    /**
     * updateResource
     * @param relation specify on which relation the operation should happen
     * @param update specify the data to manipulate
     * @param where specify the constraints a tuple needs to fullfill to be updated
     */
    Database.prototype.updateResource = function (relation, update, where) {
        return __awaiter(this, void 0, void 0, function () {
            var set, updateIndexOffset, _a, clause, values, connection;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.set(update)];
                    case 1:
                        set = _b.sent();
                        updateIndexOffset = set.values.length;
                        return [4 /*yield*/, this.where(where, updateIndexOffset)];
                    case 2:
                        _a = _b.sent(), clause = _a.clause, values = _a.values;
                        // concat the values array into the update values array
                        Array.prototype.push.apply(set.values, values);
                        return [4 /*yield*/, this.connect()];
                    case 3:
                        connection = _b.sent();
                        return [4 /*yield*/, connection.none(
                            // UPDATE relation SET a = $1 WHERE b = $2;
                            "UPDATE " + relation + " SET " + set.clause + " WHERE " + clause, set.values)];
                    case 4: 
                    // execute the query
                    return [2 /*return*/, (_b.sent()) || null];
                }
            });
        });
    };
    /**
     * deleteResource
     * @param relation specify on which relation the operation should happen
     * @param where specify the constraint a tuple needs to fullfill to be deleted
     */
    Database.prototype.deleteResource = function (relation, where) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, clause, values, connection;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.where(where)];
                    case 1:
                        _a = _b.sent(), clause = _a.clause, values = _a.values;
                        return [4 /*yield*/, this.connect()];
                    case 2:
                        connection = _b.sent();
                        return [4 /*yield*/, connection.none(
                            // DELETE FROM relation WHERE a = $1;
                            "DELETE FROM " + relation + " WHERE " + clause, values)];
                    case 3: 
                    // execute the query
                    return [2 /*return*/, (_b.sent()) || null];
                }
            });
        });
    };
    /**
     * obtain a database interface to execute queries
     */
    Database.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // postgres object could not have been initialized yet
                if (postgres === undefined) {
                    postgres = pgpromise(this.options)(this.url);
                }
                // return the postgres object
                return [2 /*return*/, postgres];
            });
        });
    };
    /**
     * reduce a select object into a where clause
     * @param selection value object where the keys are the columns compare with the values
     * @param offset initialize the decoy ($x) literal with an offset
     */
    Database.prototype.where = function (selection, offset) {
        if (offset === void 0) { offset = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var where;
            return __generator(this, function (_a) {
                where = Object.keys(selection).reduce(function (acc, key, i) {
                    acc.values.push(selection[key]);
                    acc.clause += key + " = $" + (i + 1 + offset) + " AND ";
                    return acc;
                }, { clause: "", values: [] });
                // remove the last AND off the clause
                where.clause = where.clause.slice(0, -5);
                return [2 /*return*/, where];
            });
        });
    };
    /**
     * reduce an update object into a set clause
     * @param update value object where the keys are the columns to update and the values
     * are the values to insert
     * @param offset initialize the decoy ($x) literal with an offset
     */
    Database.prototype.set = function (update, offset) {
        if (offset === void 0) { offset = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var set;
            return __generator(this, function (_a) {
                set = Object.keys(update).reduce(function (acc, key, i) {
                    acc.values.push(update[key]);
                    acc.clause += key + " = $" + (i + 1 + offset) + ", ";
                    return acc;
                }, { clause: "", values: [] });
                // remove the last space and comma of the clause string
                set.clause = set.clause.slice(0, -2);
                return [2 /*return*/, set];
            });
        });
    };
    return Database;
}());
exports.Database = Database;
var db = new Database("");

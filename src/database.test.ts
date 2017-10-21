import * as assert from "assert";
import * as mocha from "mocha";

import { Database } from "./database";

const database = new Database<{ id?: number, name?: string, verified?: boolean }, "users">(
    "postgres://jakob:Gailbach@localhost:5432/postgres_driver");

describe("testing database.ts", () => {

    it("should create a tuple without any errors", async () => {
        await database.createResource("users", { id: 0, name: "jakob lorz", verified: true });
    });

    it("should find inserted tuple", async () => {
        const user = await database.readResource<{ id: number, name: string, verified: boolean }, { id: number }>(
            "users", { id: 0 }, ["id", "name", "verified"]);
        
        assert.equal(user.id, 0);
        assert.equal(user.name, "jakob lorz");
        assert.equal(user.verified, true);
    });
});

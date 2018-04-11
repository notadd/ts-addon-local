import { MiddlewaresConsumer, Module, NestModule, RequestMethod, } from "@nestjs/common";
import { GraphQLFactory, GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { graphiqlExpress, graphqlExpress } from "apollo-server-express";
import { LocalModule } from "../src/local.module";

@Module({
    modules: [ GraphQLModule, LocalModule, TypeOrmModule.forRoot({
        name: "local",
        type: "postgres",
        host: "localhost",
        port: 5433,
        username: "postgres",
        password: "123456",
        database: "postgres",
        synchronize: true,
        dropSchema: true,
        logger: "simple-console",
        logging: "all",
        entities: [ "../**/*.entity.ts" ]
    }) ]
})
export class ApplicationModule implements NestModule {

    constructor(private readonly graphQLFactory: GraphQLFactory) {
    }

    configure(consumer: MiddlewaresConsumer) {
        const typeDefs = this.graphQLFactory.mergeTypesByPaths("./src/**/*.types.graphql");
        const schema = this.graphQLFactory.createSchema({ typeDefs });
        consumer
            .apply(graphiqlExpress({ endpointURL: "/graphql" }))
            .forRoutes({ path: "/graphiql", method: RequestMethod.GET })
            .apply(graphqlExpress(req => ({ schema, rootValue: req })))
            .forRoutes({ path: "/graphql", method: RequestMethod.ALL });
    }
}

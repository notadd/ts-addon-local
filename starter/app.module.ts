import { MiddlewareConsumer, Module, NestModule, RequestMethod, Inject } from "@nestjs/common";
import { graphiqlExpress, graphqlExpress } from "apollo-server-express";
import { GraphQLFactory, GraphQLModule } from "@nestjs/graphql";
import { LocalModule } from "../src/local.module";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [GraphQLModule, LocalModule, TypeOrmModule.forRoot({
        type: "postgres",
        host: "localhost",
        port: 5433,
        username: "postgres",
        password: "123456",
        database: "postgres",
        synchronize: true,
        dropSchema: true,
        logger: "simple-console",
        logging: false,
        entities: ["./**/*.entity.ts"]
    })]
})
export class ApplicationModule implements NestModule {

    constructor( 
        @Inject(GraphQLFactory) private readonly graphQLFactory: GraphQLFactory
    ) { }

    configure(consumer: MiddlewareConsumer) {
        const typeDefs = this.graphQLFactory.mergeTypesByPaths("./**/*.types.graphql");
        const schema = this.graphQLFactory.createSchema({ typeDefs });
        consumer
            .apply(graphiqlExpress({ endpointURL: "/graphql" }))
            .forRoutes("/graphiql")
            .apply(graphqlExpress(req => ({ schema, rootValue: req })))
            .forRoutes("/graphql");
    }
}

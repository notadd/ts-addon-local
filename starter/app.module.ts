import { Module, MiddlewaresConsumer, NestModule, RequestMethod, } from '@nestjs/common';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { GraphQLModule, GraphQLFactory } from '@nestjs/graphql';
import { LocalModule } from '../src/LocalModule';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  modules: [GraphQLModule, LocalModule, TypeOrmModule.forRoot({
    name: 'local',
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'postgres',
    password: '123456',
    database: "local",
    synchronize: true,
    dropSchema: true,
    logger: 'simple-console',
    logging: null,
    entities: ['../**/*.entity.ts']
  })]
})


export class ApplicationModule implements NestModule {

  constructor(private readonly graphQLFactory: GraphQLFactory) { }

  configure(consumer: MiddlewaresConsumer) {
    const typeDefs = this.graphQLFactory.mergeTypesByPaths('./src/**/*.types.graphql');
    const schema = this.graphQLFactory.createSchema({ typeDefs });
    consumer
      .apply(graphiqlExpress({ endpointURL: '/graphql' }))
      .forRoutes({ path: '/graphiql', method: RequestMethod.GET })
      .apply(graphqlExpress(req => ({ schema, rootValue: req })))
      .forRoutes({ path: '/graphql', method: RequestMethod.ALL });
  }
}

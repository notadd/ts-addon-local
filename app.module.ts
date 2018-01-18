import { Module,MiddlewaresConsumer,NestModule,RequestMethod, } from '@nestjs/common';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { GraphQLModule , GraphQLFactory} from '@nestjs/graphql';
import { LocalModule } from './src/local/LocalModule'
@Module({
  modules: [GraphQLModule,LocalModule]
})


export class ApplicationModule implements NestModule{

  constructor(private readonly graphQLFactory: GraphQLFactory){}

  configure(consumer: MiddlewaresConsumer) {
    const typeDefs = this.graphQLFactory.mergeTypesByPaths('./src/local/graphql/type/*.graphql');
    const schema = this.graphQLFactory.createSchema({ typeDefs });
    consumer
      .apply(graphiqlExpress({ endpointURL: '/graphql' }))
      .forRoutes({ path: '/graphiql', method: RequestMethod.GET })
      .apply(graphqlExpress(req => ({ schema, rootValue: req })))
      .forRoutes({ path: '/graphql', method: RequestMethod.ALL });
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema'; // Adjust the import path as necessary
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name, // User is the class name defined in schemas/user.schema.ts
        schema: UserSchema, // Assuming you have defined UserSchema in schemas/user.schema.ts
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Export UserService if it needs to be used in other modules
})
export class UserModule {}

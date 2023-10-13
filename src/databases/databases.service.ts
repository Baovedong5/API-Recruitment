import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import {
  Permission,
  PermissionDocument,
} from 'src/permissions/schemas/permission.schema';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import { ADMIN_ROLE, INIT_PERMISSIONS, USER_ROLE } from './sample';

@Injectable()
export class DatabasesService implements OnModuleInit {
  private readonly logger = new Logger(DatabasesService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: SoftDeleteModel<UserDocument>,

    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,

    @InjectModel(Permission.name)
    private permissionModel: SoftDeleteModel<PermissionDocument>,

    private configService: ConfigService,
    private userService: UsersService,
  ) {}

  async onModuleInit() {
    const isInit = this.configService.get<string>('SHOULD_INIT');
    if (Boolean(isInit)) {
      const countUser = await this.userModel.count({});
      const countPermission = await this.permissionModel.count({});
      const countRole = await this.roleModel.count({});

      //create permissions
      if (countPermission === 0) {
        await this.permissionModel.insertMany(INIT_PERMISSIONS);
      }

      // create role
      if (countRole === 0) {
        const permission = await this.permissionModel.find({}).select('_id');

        await this.roleModel.insertMany([
          {
            name: ADMIN_ROLE,
            description: 'Admin thì full quyền',
            isActive: true,
            permissions: permission,
          },
          {
            name: USER_ROLE,
            description: 'Người dùng, ứng viên sử dụng hệ thống',
            isActive: true,
            permissions: [],
          },
        ]);
      }

      if (countUser === 0) {
        const adminRole = await this.roleModel.findOne({ name: ADMIN_ROLE });
        const userRole = await this.roleModel.findOne({ name: USER_ROLE });

        await this.userModel.insertMany([
          {
            name: 'Thanh Phương',
            email: 'phuong@gmail.com',
            password: this.userService.hashPassword(
              this.configService.get<string>('INIT_PASSWORD'),
            ),
            age: 21,
            gender: 'Male',
            address: 'Hà Nội',
            role: adminRole?._id,
          },
          {
            name: 'Văn Thanh',
            email: 'thanh@gmail.com',
            password: this.userService.hashPassword(
              this.configService.get<string>('INIT_PASSWORD'),
            ),
            age: 19,
            gender: 'Male',
            address: 'Bắc Giang',
            role: userRole?._id,
          },
          {
            name: 'ADMIN',
            email: 'admin@gmail.com',
            password: this.userService.hashPassword(
              this.configService.get<string>('INIT_PASSWORD'),
            ),
            age: 99,
            gender: 'Male',
            address: 'Việt Nam',
            role: adminRole?._id,
          },
        ]);
      }

      if (countUser > 0 && countPermission > 0 && countRole > 0) {
        this.logger.log('>>> ALREADY INIT SAMPLE DATABASE');
      }
    }
  }
}

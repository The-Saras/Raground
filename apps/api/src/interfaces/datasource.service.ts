import { DataSource } from "@prisma/client";
import { CreateDataSourceDto } from "../modules/datasoruce/datasource.types";

export interface IDataSourceService {
    create(
        workspaceId: string,
        data: CreateDataSourceDto
    ): Promise<DataSource>;
}
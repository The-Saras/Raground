import { PrismaClient, DataSource, JobType, Prisma } from "@prisma/client";

import { IDataSourceService } from "../interfaces/datasource.service";
import { CreateDataSourceDto } from "../modules/datasoruce/datasource.types";

const prisma = new PrismaClient();

export class DataSourceService implements IDataSourceService {
    async create(
        workspaceId: string,
        data: CreateDataSourceDto
    ): Promise<DataSource> {
        const workspace = await prisma.workspace.findUnique({
            where: {
                id: workspaceId,
            },
        });

        if (!workspace) {
            throw new Error("Workspace not found");
        }

        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const dataSource = await tx.dataSource.create({
                data: {
                    title: data.title,
                    content: data.content,
                    workspaceId,
                },
            });

            await tx.job.create({
                data: {
                    workspaceId,
                    dataSourceId: dataSource.id,
                    type: JobType.INGEST,
                },
            });

            return dataSource;
        });
    }
}
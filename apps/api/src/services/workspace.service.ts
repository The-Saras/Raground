import { PrismaClient, Workspace } from "@prisma/client";

import { IWorkspaceService } from "../interfaces/workspace.service";
import { CreateWorkspaceDto } from "../modules/workspace/workspace.types";

const prisma = new PrismaClient();

export class WorkspaceService implements IWorkspaceService {
    async create(
        ownerId: string,
        data: CreateWorkspaceDto
    ): Promise<Workspace> {
        return prisma.workspace.create({
            data: {
                name: data.name,
                description: data.description,
                ownerId,
            },
        });
    }

    async getAll(ownerId: string): Promise<Workspace[]> {
        return prisma.workspace.findMany({
            where: {
                ownerId: ownerId
            }
        })
    }
    async getById(ownerId: string, id: string): Promise<Workspace | null> {
        return prisma.workspace.findFirst({
            where: {
                id: id, ownerId: ownerId
            },
            include: {
                dataSources: {
                    orderBy: {
                        createdAt: "desc"
                    }
                },
                jobs: {
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        }) as any;
    }
}
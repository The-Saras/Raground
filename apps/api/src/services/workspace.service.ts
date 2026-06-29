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
}
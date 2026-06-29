import { Workspace } from "@prisma/client";
import { CreateWorkspaceDto } from "../modules/workspace/workspace.types";

export interface IWorkspaceService {
    create(
        ownerId: string,
        data: CreateWorkspaceDto
    ): Promise<Workspace>;
}
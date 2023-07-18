import { IOContext } from "../../../types/context";
import { gameEmitters } from "./gameEmitters";
import { parseRoom } from "../../../features/parseRooms/parseRoom";

export const updateGameRoom = (context: IOContext, roomId: string) => {
  const { io, roomCache } = context;

  const room = roomCache.getRoomById(roomId);

  if (!room) throw new Error("Room does not exist");

  const parsedRoom = parseRoom(context, roomId);

  gameEmitters.receiveRoom(io.to(roomId).emit, parsedRoom);
};

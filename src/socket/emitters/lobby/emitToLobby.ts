import { Context } from "../../../types/context";
import { lobbyEmitters } from "./lobbyEmitters";
import { parseAllRooms } from "../../../features/parseRooms/parseAllRooms";

export const updateLobbyRooms = (context: Context) => {
  const { io } = context;

  const parsedRooms = parseAllRooms(context);

  lobbyEmitters.receiveRooms(io.to("lobby").emit, parsedRooms);
};

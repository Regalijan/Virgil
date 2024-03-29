defmodule Plug.Scope do
  import Plug.Conn

  @spec init(any) :: any
  def init(options) do
    options
  end

  @spec check_resource(Plug.Conn.t(), String) :: Plug.Conn.t()
  defp check_resource(conn, path) do
    path_segments = String.split(path, "/", trim: true)

    case List.first(path_segments) == "guild" && conn.assigns[:token_data]["type"] != "user" do
      true -> validate_scopes(conn, path_segments)
      false -> validate_user(conn, path_segments)
    end
  end

  @spec invalid_scope(Plug.Conn.t()) :: Plug.Conn.t()
  defp invalid_scope(conn) do
    conn
    |> send_resp(403, "{\"error\":\"Insufficient scope\"}")
    |> halt
  end

  @spec validate_scopes(Plug.Conn.t(), String) :: Plug.Conn.t()
  defp validate_scopes(conn, path_segments) do
    scopes = conn.assigns[:token_data]["scopes"]
    resource = Enum.at(path_segments, 2)
    guild = Enum.at(path_segments, 1)

    case Enum.member?(scopes, resource) && conn.assigns[:token_data]["guild"] == guild do
      false -> invalid_scope(conn)
      true -> conn
    end
  end

  @spec validate_user(Plug.Conn.t(), String) :: Plug.Conn.t()
  defp validate_user(conn, path_segments) do
    guild_id = Enum.at(path_segments, 1)

    case Enum.find(conn.assigns[:token_data]["guilds"], fn guild ->
           Map.get(guild, "id") == guild_id &&
             Bitwise.band(
               String.to_integer(Map.get(guild, "permissions")),
               32
             ) == 32
         end) do
      true -> conn
      false -> invalid_scope(conn)
    end
  end

  @spec call(Plug.Conn.t(), any) :: Plug.Conn.t()
  def call(%Plug.Conn{request_path: path} = conn, _opts) do
    conn
    |> put_resp_content_type("application/json")
    |> check_resource(path)
  end
end

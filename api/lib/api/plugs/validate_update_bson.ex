defmodule Plug.UpdateBSONValidator do
  import Plug.Conn

  @spec init(any) :: any
  def init(options) do
    options
  end

  defp send_400(conn, body) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(400, Jason.encode!(body))
    |> halt
  end

  defp validate_map(map, conn) do
    try do
      conn =
        assign(
          conn,
          :upd_doc,
          Map.filter(
            map,
            fn {key, _val} ->
              key === "$set" || key === "$unset"
            end
          )
        )

      conn
    rescue
      e ->
        IO.puts(inspect(e))
        conn
    end
  end

  defp handle(conn) do
    cond do
      conn.method === "PATCH" ->
        try do
          body_map = elem(read_body(conn), 1)
          validate_map(Jason.decode!(body_map), conn)
        rescue
          _ -> send_400(conn, %{error: "Invalid JSON"})
        end

      true ->
        conn
    end
  end

  @spec call(Plug.Conn.t(), any) :: Plug.Conn.t()
  def call(%Plug.Conn{request_path: _path} = conn, _opts) do
    conn
    |> handle
  end
end

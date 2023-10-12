defmodule Api.MixProject do
  use Mix.Project

  def project do
    [
      app: :api,
      version: "0.1.0",
      elixir: "~> 1.13",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      applications: [
        :amqp,
        :dotenv,
        :finch,
        :jason,
        :mongodb_driver,
        :plug_cowboy,
        :redix
      ],
      extra_applications: [:logger],
      mod: {Api.Application, []}
    ]
  end

  defp deps do
    [
      {:amqp, "~> 3.3"},
      {:dotenv, "~> 3.1.0"},
      {:finch, "~> 0.16.0"},
      {:jason, "~> 1.4"},
      {:mongodb_driver, "~> 1.2"},
      {:plug_cowboy, "~> 2.6"},
      {:redix, "~> 1.2"}
    ]
  end
end
